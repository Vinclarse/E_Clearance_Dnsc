import { useState } from "react";
import { Search, UserPlus, MoreHorizontal, AlertTriangle } from "lucide-react";
import "./SignatoryRoles.css";

/* ── Mock data matching the designer mockup ── */
const ROLES = [
  {
    id: 1, step: 1, name: "Librarians",    subtitle: "Library Clearance",
    totalStaff: 6, coveredInstitutes: 3, totalInstitutes: 3,
    staff: [
      { id: 1, initials: "HC", color: "#6a8f5a", name: "Henry Co",        username: "hco",    institute: "Institute of Computing",  program: "All Programs", assignedOn: "Aug 14, 2026", status: "Active" },
      { id: 2, initials: "GR", color: "#7a6a9a", name: "Grace Rivera",    username: "grivera", institute: "Institute of Education",   program: "All Programs", assignedOn: "Aug 14, 2026", status: "Active" },
    ],
    uncovered: [],
    coverageBar: 1.0,
  },
  {
    id: 2, step: 2, name: "Cashiers",      subtitle: "Cashier Clearance",
    totalStaff: 4, coveredInstitutes: 3, totalInstitutes: 3,
    staff: [
      { id: 1, initials: "GB", color: "#8a6a5a", name: "Grace Bautista",  username: "gbautista", institute: "Institute of Computing", program: "All Programs", assignedOn: "Aug 14, 2026", status: "Active" },
    ],
    uncovered: [],
    coverageBar: 1.0,
  },
  {
    id: 3, step: 3, name: "Advisers",      subtitle: "Adviser Approval",
    totalStaff: 38, coveredInstitutes: 5, totalInstitutes: 5,
    staff: [],
    uncovered: [],
    coverageBar: 1.0,
  },
  {
    id: 4, step: 4, name: "Program Chairs", subtitle: "Program Chair Approval",
    totalStaff: 4, coveredInstitutes: 4, totalInstitutes: 5,
    staff: [
      { id: 1, initials: "MS", color: "#6a8f5a", name: "Prof. Maria Santos",  username: "msantos",  institute: "Institute of Computing",  program: "BSIT", assignedOn: "Aug 14, 2026", status: "Active" },
      { id: 2, initials: "DO", color: "#5a7a9a", name: "Prof. Daniel Ocampo", username: "docampo",  institute: "Institute of Computing",  program: "BSIS", assignedOn: "Aug 14, 2026", status: "Active" },
      { id: 3, initials: "TL", color: "#9a7a5a", name: "Prof. Teresa Lim",    username: "tlim",     institute: "Institute of Education",  program: "BEED", assignedOn: "Aug 21, 2026", status: "Active" },
      { id: 4, initials: "RA", color: "#7a5a9a", name: "Prof. Roberto Aquino",username: "raquino",  institute: "Institute of Education",  program: "BSED", assignedOn: "Aug 21, 2026", status: "Inactive" },
    ],
    uncovered: [{ program: "BSBA", institute: "Institute of Business" }],
    coverageBar: 4 / 5,
  },
  {
    id: 5, step: 5, name: "Governors",     subtitle: "Institute Governor Clearance",
    totalStaff: 3, coveredInstitutes: 3, totalInstitutes: 3,
    staff: [],
    uncovered: [],
    coverageBar: 1.0,
  },
  {
    id: 6, step: 6, name: "Deans",         subtitle: "Institute Dean Clearance",
    totalStaff: 3, coveredInstitutes: 3, totalInstitutes: 3,
    staff: [],
    uncovered: [],
    coverageBar: 1.0,
  },
];

const STATUS_CFG = {
  Active:   { bg: "rgba(74,124,63,0.13)",  color: "#2f6b25", dot: "#4a7c3f" },
  Inactive: { bg: "rgba(107,117,96,0.12)", color: "#555f4a", dot: "#8a9280" },
};

export default function SignatoryRoles() {
  const [selectedId, setSelectedId] = useState(4);
  const [staffSearch, setStaffSearch] = useState("");

  const selected = ROLES.find((r) => r.id === selectedId);
  const uncoveredCount = ROLES.filter((r) => r.uncovered.length > 0).length;

  const filteredStaff = selected
    ? selected.staff.filter((s) =>
        staffSearch === "" ||
        s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.username.toLowerCase().includes(staffSearch.toLowerCase())
      )
    : [];

  return (
    <div className="sr2-page">
      <div className="sr2-layout">

        {/* ══ LEFT PANEL – Role list ══ */}
        <div className="sr2-left">
          <div className="sr2-left-header">
            <h2 className="sr2-left-title">Clearance Roles</h2>
            <p className="sr2-left-sub">In approval order · select a role to manage its staff</p>
          </div>

          <div className="sr2-role-list">
            {ROLES.map((role) => (
              <button
                key={role.id}
                className={"sr2-role-item" + (selectedId === role.id ? " selected" : "")}
                onClick={() => { setSelectedId(role.id); setStaffSearch(""); }}
              >
                <div className="sr2-role-step">{role.step}</div>
                <div className="sr2-role-info">
                  <div className="sr2-role-name">{role.name}</div>
                  <div className="sr2-role-subtitle">{role.subtitle}</div>
                  <div className="sr2-role-bar-wrap">
                    <div
                      className="sr2-role-bar-fill"
                      style={{ width: `${role.coverageBar * 100}%` }}
                    />
                  </div>
                  <div className="sr2-role-coverage">
                    {role.coveredInstitutes} of {role.totalInstitutes} {role.totalInstitutes === 5 ? "programs" : "institutes"}
                  </div>
                </div>
                <div className="sr2-role-count">
                  <span className="sr2-role-count-num">{role.totalStaff}</span>
                  <span className="sr2-role-count-label">staff</span>
                </div>
              </button>
            ))}
          </div>

          {/* Warning banner */}
          {uncoveredCount > 0 && (
            <div className="sr2-warning-banner">
              <AlertTriangle size={14} />
              <div>
                <strong>{uncoveredCount} of {ROLES.length} roles fully covered</strong>
                <div className="sr2-warning-detail">
                  Program Chair has no signatory for BSBA, so students in that program cannot pass Step 4.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ══ RIGHT PANEL – Detail view ══ */}
        {selected && (
          <div className="sr2-right">
            {/* Step label + Title */}
            <div className="sr2-detail-header">
              <div>
                <div className="sr2-step-label">STEP {selected.step} OF {ROLES.length} · AUTHORIZING ROLE</div>
                <h1 className="sr2-detail-title">{selected.name}</h1>
                <p className="sr2-detail-desc">
                  {selected.step === 4
                    ? "Department-level sign-off. Each Program Chair approves students in their own program and validates term enrollment."
                    : `Step ${selected.step} clearance — ${selected.subtitle}.`}
                </p>
              </div>
              <button className="sr2-assign-btn">
                <UserPlus size={15} /> Assign Staff
              </button>
            </div>

            {/* Stats */}
            <div className="sr2-stats-row">
              <div className="sr2-stat-box green-left">
                <div className="sr2-stat-num">{selected.totalStaff}</div>
                <div className="sr2-stat-label">Assigned staff</div>
              </div>
              <div className="sr2-stat-box teal-left">
                <div className="sr2-stat-num">{selected.staff.filter(s => s.status === "Active").length}</div>
                <div className="sr2-stat-label">Active signatories</div>
              </div>
              <div className="sr2-stat-box yellow-left">
                <div className="sr2-stat-num">{selected.coveredInstitutes}/{selected.totalInstitutes}</div>
                <div className="sr2-stat-label">Programs covered</div>
              </div>
              <div className="sr2-stat-box blue-left">
                <div className="sr2-stat-num">102</div>
                <div className="sr2-stat-label">Open Items at Step {selected.step}</div>
              </div>
            </div>

            {/* Staff filters */}
            <div className="sr2-staff-filters">
              <div className="sr2-search-wrap">
                <Search size={13} className="sr2-search-icon" />
                <input
                  className="sr2-search"
                  placeholder="Search staff or username"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                />
              </div>
              <select className="sr2-select">
                <option>All Institutes</option>
                <option>Institute of Computing</option>
                <option>Institute of Education</option>
                <option>Institute of Business</option>
              </select>
              <select className="sr2-select">
                <option>All Statuses</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
              <span className="sr2-staff-count">{filteredStaff.length} assignments</span>
            </div>

            {/* Staff table */}
            <div className="sr2-staff-table-wrap">
              <table className="sr2-staff-table">
                <thead>
                  <tr>
                    <th>Staff</th>
                    <th>Institute</th>
                    <th>Program</th>
                    <th>Assigned On</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="sr2-empty">No staff assigned to this role yet.</td>
                    </tr>
                  ) : (
                    filteredStaff.map((s) => {
                      const cfg = STATUS_CFG[s.status] || STATUS_CFG.Inactive;
                      return (
                        <tr key={s.id}>
                          <td>
                            <div className="sr2-staff-cell">
                              <div className="sr2-staff-avatar" style={{ background: s.color }}>
                                {s.initials}
                              </div>
                              <div>
                                <div className="sr2-staff-name">{s.name}</div>
                                <div className="sr2-staff-username">{s.username} · Employee username</div>
                              </div>
                            </div>
                          </td>
                          <td className="sr2-td-muted">{s.institute}</td>
                          <td>
                            <span className="sr2-program-pill">{s.program}</span>
                          </td>
                          <td className="sr2-td-muted">{s.assignedOn}</td>
                          <td>
                            <span className="sr2-status-badge" style={{ background: cfg.bg, color: cfg.color }}>
                              <span className="sr2-status-dot" style={{ background: cfg.dot }} />
                              {s.status}
                            </span>
                          </td>
                          <td>
                            <button className="sr2-more-btn"><MoreHorizontal size={14} /></button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Uncovered program warnings */}
            {selected.uncovered.map((u, i) => (
              <div key={i} className="sr2-uncovered-banner">
                <div className="sr2-uncovered-info">
                  <AlertTriangle size={15} className="sr2-uncovered-icon" />
                  <div>
                    <div className="sr2-uncovered-name">{u.program} · {u.institute}</div>
                    <div className="sr2-uncovered-desc">No Program Chair assigned. Students in this program cannot pass Step {selected.step}.</div>
                  </div>
                </div>
                <button className="sr2-assign-btn-sm">Assign Staff</button>
              </div>
            ))}

            {/* Footer note */}
            <div className="sr2-footer-note">
              <span>🔒</span> Signatories only see students inside the institute and program they are assigned to.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
