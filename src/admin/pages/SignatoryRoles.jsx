import { useEffect, useMemo, useState } from "react";
import { Search, UserPlus, AlertTriangle } from "lucide-react";
import { fetchClearanceTypeDashboard, fetchClearanceTypes, pickClearanceType } from "../services/dashboardApi.js";
import {
  apiErrorMessage,
  assignRoles,
  fetchItemTotal,
  fetchRoles,
  fetchUser,
  fetchUsers,
} from "../services/portalApi.js";
import PortalLoading from "../../components/PortalLoading.jsx";
import "./SignatoryRoles.css";

const SIGNATORY_ORDER = ["Librarians", "Cashiers", "Advisers", "Program Chairs", "Governors", "Deans"];

function sameRole(left, right) {
  return String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();
}
const STATUS_CFG = {
  Active: { bg: "rgba(74,124,63,0.13)", color: "#2f6b25", dot: "#4a7c3f" },
  Inactive: { bg: "rgba(107,117,96,0.12)", color: "#555f4a", dot: "#8a9280" },
};

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "ST";
}

function roleNames(user) {
  return (Array.isArray(user?.groups) ? user.groups : [])
    .map((group) => String(group?.name ?? group))
    .filter(Boolean);
}

export default function SignatoryRoles() {
  const [roles, setRoles] = useState([]);
  const [selectedName, setSelectedName] = useState(SIGNATORY_ORDER[0]);
  const [staffSearch, setStaffSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [catalog, types] = await Promise.all([fetchRoles(), fetchClearanceTypes()]);
        const selectedType = pickClearanceType(types);
        const dashboard = selectedType ? await fetchClearanceTypeDashboard(selectedType.id).catch(() => null) : null;
        const requirements = dashboard?.clearance_type?.requirements ?? dashboard?.requirements ?? [];
        const names = SIGNATORY_ORDER.map((name) => catalog.find((role) => sameRole(role.name, name))?.name || name);
        const ordered = names.map((name, index) => {
          const requirement = requirements.find((item) => sameRole(item.authorizing_role_name, name));
          const role = catalog.find((item) => sameRole(item.name, name));
          return {
            name,
            step: Number(requirement?.order_sequence ?? index + 1),
            subtitle: requirement?.name || role?.description || name,
            groupId: role?.group_id ?? requirement?.authorizing_role_id ?? null,
            memberCount: Number(role?.member_count ?? 0),
            staff: [],
            openItems: 0,
          };
        });
        const enriched = await Promise.all(ordered.map(async (role) => {
          const [users, pending, issues] = await Promise.all([
            fetchUsers({ group_name: role.name, per_page: 50, current_page: 1 }).catch(() => ({ items: [] })),
            role.groupId ? fetchItemTotal({ requirement__authorizing_role: role.groupId, status: "pending" }).catch(() => 0) : 0,
            role.groupId ? fetchItemTotal({ requirement__authorizing_role: role.groupId, status: "has_issue" }).catch(() => 0) : 0,
          ]);
          return {
            ...role,
            openItems: Number(pending || 0) + Number(issues || 0),
            staff: users.items.map((user) => ({
              id: user.id,
              name: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username,
              username: user.username,
              institute: user.institute?.institute_name || user.institute_name || "—",
              active: user.is_active !== false,
            })),
          };
        }));
        if (cancelled) return;
        setRoles(enriched.sort((a, b) => a.step - b.step));
        setError("");
      } catch (loadError) {
        if (!cancelled) setError(apiErrorMessage(loadError, "Signatory roles could not be loaded."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [notice]);

  const selected = roles.find((role) => role.name === selectedName) || roles[0];
  const filteredStaff = useMemo(() => {
    if (!selected) return [];
    const query = staffSearch.trim().toLowerCase();
    return selected.staff.filter((member) => {
      const matchesQuery = !query || member.name.toLowerCase().includes(query) || member.username.toLowerCase().includes(query);
      const matchesStatus = !statusFilter || (statusFilter === "Active" ? member.active : !member.active);
      return matchesQuery && matchesStatus;
    });
  }, [selected, staffSearch, statusFilter]);

  useEffect(() => {
    if (!assignOpen) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      fetchUsers({
        search: userQuery.trim() || undefined,
        is_staff: true,
        per_page: 8,
        current_page: 1,
      })
        .then((result) => {
          if (!cancelled) setCandidates(result.items);
        })
        .catch(() => {
          if (!cancelled) setCandidates([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [assignOpen, userQuery]);

  async function assignUser(userId) {
    if (!selected) return;
    setAssigning(true);
    setError("");
    try {
      const user = await fetchUser(userId);
      const existing = roleNames(user);
      const rolesToSend = existing.includes(selected.name) ? existing : [...existing, selected.name];
      await assignRoles(userId, rolesToSend);
      setNotice(`${selected.name} assigned.`);
      setAssignOpen(false);
      setUserQuery("");
    } catch (assignError) {
      setError(apiErrorMessage(assignError, "That role could not be assigned."));
    } finally {
      setAssigning(false);
    }
  }

  const emptyRoles = roles.filter((role) => role.staff.length === 0).length;

  if (loading) {
    return (
      <PortalLoading
        variant="roles"
        title="Loading signatory roles"
        detail="Getting the approval chain and the staff assigned to each step."
      />
    );
  }

  return (
    <div className="sr2-page">
      <div className="sr2-layout">
        <div className="sr2-left">
          <div className="sr2-left-header">
            <h2 className="sr2-left-title">Clearance Roles</h2>
            <p className="sr2-left-sub">In approval order · select a role to see its staff</p>
          </div>
          <div className="sr2-role-list">
            {roles.map((role) => (
              <button
                key={role.name}
                type="button"
                className={"sr2-role-item" + (selected?.name === role.name ? " selected" : "")}
                onClick={() => { setSelectedName(role.name); setStaffSearch(""); setAssignOpen(false); }}
              >
                <div className="sr2-role-step">{role.step}</div>
                <div className="sr2-role-info">
                  <div className="sr2-role-name">{role.name}</div>
                  <div className="sr2-role-subtitle">{role.subtitle}</div>
                </div>
                <div className="sr2-role-count">
                  <span className="sr2-role-count-num">{role.memberCount}</span>
                  <span className="sr2-role-count-label">staff</span>
                </div>
              </button>
            ))}
          </div>
          {emptyRoles > 0 && (
            <div className="sr2-warning-banner">
              <AlertTriangle size={14} />
              <div>
                <strong>{emptyRoles} of {roles.length} roles have no staff yet</strong>
                <div className="sr2-warning-detail">Students cannot pass a step until someone holds that signatory role.</div>
              </div>
            </div>
          )}
        </div>

        {selected && (
          <div className="sr2-right">
            <div className="sr2-detail-header">
              <div>
                <div className="sr2-step-label">STEP {selected.step} OF {roles.length} · AUTHORIZING ROLE</div>
                <h1 className="sr2-detail-title">{selected.name}</h1>
                <p className="sr2-detail-desc">{selected.subtitle}</p>
              </div>
              <button type="button" className="sr2-assign-btn" onClick={() => setAssignOpen((open) => !open)}>
                <UserPlus size={15} /> Assign Staff
              </button>
            </div>

            {notice && <p className="sr2-banner">{notice}</p>}
            {error && <p className="sr2-banner sr2-banner--error" role="alert">{error}</p>}

            {assignOpen && (
              <div className="sr2-assign-panel">
                <input
                  className="sr2-search"
                  placeholder="Search a user to assign"
                  value={userQuery}
                  onChange={(event) => setUserQuery(event.target.value)}
                />
                <div className="sr2-candidate-list">
                  {candidates.length === 0 ? (
                    <p>No matching users.</p>
                  ) : (
                    candidates.map((user) => (
                      <button key={user.id} type="button" disabled={assigning} onClick={() => assignUser(user.id)}>
                        {[user.first_name, user.last_name].filter(Boolean).join(" ") || user.username}
                        <span>{user.username}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="sr2-stats-row">
              <div className="sr2-stat-box green-left">
                <div className="sr2-stat-num">{selected.memberCount}</div>
                <div className="sr2-stat-label">Assigned staff</div>
              </div>
              <div className="sr2-stat-box teal-left">
                <div className="sr2-stat-num">{selected.staff.filter((member) => member.active).length}</div>
                <div className="sr2-stat-label">Active signatories</div>
              </div>
              <div className="sr2-stat-box yellow-left">
                <div className="sr2-stat-num">{selected.staff.length ? 1 : 0}/1</div>
                <div className="sr2-stat-label">Institute covered</div>
              </div>
              <div className="sr2-stat-box blue-left">
                <div className="sr2-stat-num">{selected.openItems}</div>
                <div className="sr2-stat-label">Open items at this step</div>
              </div>
            </div>

            <div className="sr2-staff-filters">
              <div className="sr2-search-wrap">
                <Search size={13} className="sr2-search-icon" />
                <input
                  className="sr2-search"
                  placeholder="Search staff or username"
                  value={staffSearch}
                  onChange={(event) => setStaffSearch(event.target.value)}
                />
              </div>
              <select className="sr2-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <span className="sr2-staff-count">{filteredStaff.length} assignments</span>
            </div>

            <div className="sr2-staff-table-wrap table-scroll">
              <table className="sr2-staff-table">
                <thead>
                  <tr>
                    <th>Staff</th>
                    <th>Institute</th>
                    <th>Username</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.length === 0 ? (
                    <tr><td colSpan={4} className="sr2-empty">No staff assigned to this role yet.</td></tr>
                  ) : (
                    filteredStaff.map((member) => {
                      const cfg = member.active ? STATUS_CFG.Active : STATUS_CFG.Inactive;
                      return (
                        <tr key={member.id}>
                          <td>
                            <div className="sr2-staff-cell">
                              <div className="sr2-staff-avatar">{initials(member.name)}</div>
                              <div>
                                <div className="sr2-staff-name">{member.name}</div>
                                <div className="sr2-staff-username">{member.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="sr2-td-muted">{member.institute}</td>
                          <td className="sr2-td-muted">{member.username}</td>
                          <td>
                            <span className="sr2-status-badge" style={{ background: cfg.bg, color: cfg.color }}>
                              <span className="sr2-status-dot" style={{ background: cfg.dot }} />
                              {member.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="sr2-footer-note">
              Signatories only see students inside the institute and program they are assigned to.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
