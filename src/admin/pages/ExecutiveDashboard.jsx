import { useEffect, useState } from "react";
import { displayApiText } from "../../services/clearanceDisplay.js";
import SidebarPanel from "../components/SidebarPanel.jsx";
import {
  apiErrorMessage,
  fetchAdminSummary,
  fetchClearanceTypeDashboard,
  fetchClearanceTypes,
  fetchOfficeBacklog,
  pickClearanceType,
  presentTerm,
} from "../services/dashboardApi.js";
import PortalLoading from "../../components/PortalLoading.jsx";
import "./ExecutiveDashboard.css";

const STATUS_COLORS = {
  completed: "#5a7a3a",
  pending: "#c4913a",
  in_progress: "#c47a3a",
  rejected: "#c43a3a",
};

function percentOf(count, total) {
  if (!total) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function DonutChart({ segments }) {
  const cx = 60;
  const cy = 60;
  const r = 46;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * r;
  const visible = segments.filter((segment) => segment.pct > 0);
  const gap = visible.length > 1 ? 3 : 0;

  const positioned = visible.reduce((state, segment) => {
    const len = Math.max(0, circumference * segment.pct - gap);
    return {
      used: state.used + len + gap,
      items: [...state.items, { ...segment, len, offset: state.used }],
    };
  }, { used: 0, items: [] }).items;

  return (
    <svg width="130" height="130" viewBox="0 0 120 120" className="donut-svg" aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ece9e1" strokeWidth={strokeWidth} />
      <g transform={`rotate(-90, ${cx}, ${cy})`}>
        {positioned.map((segment) => (
          <circle
            key={segment.label}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segment.len} ${circumference - segment.len}`}
            strokeDashoffset={-segment.offset}
            strokeLinecap="butt"
          />
        ))}
      </g>
    </svg>
  );
}

function statusCounts(summary, dashboard) {
  const stats = dashboard?.stats;
  if (stats) {
    const completed = Number(stats.completed_count ?? 0);
    const pending = Number(stats.pending_count ?? 0);
    const inProgress = Number(stats.in_progress_count ?? 0);
    const rejected = Number(stats.rejected_count ?? 0);
    const issued = Number(stats.issued_students_count ?? 0);
    const statusTotal = completed + pending + inProgress + rejected;
    return {
      total: statusTotal || issued,
      completed,
      pending,
      inProgress,
      rejected,
    };
  }

  const counts = summary?.student_clearances ?? {};
  return {
    total: Number(counts.total ?? 0),
    completed: Number(counts.completed ?? 0),
    pending: Number(counts.pending ?? 0),
    inProgress: Number(counts.in_progress ?? 0),
    rejected: Number(counts.rejected ?? 0),
  };
}

function buildView(summary, backlog, dashboard) {
  const { total, completed, pending, inProgress, rejected } = statusCounts(summary, dashboard);
  const distribution = [
    { label: "Completed", count: completed, color: STATUS_COLORS.completed },
    { label: "Pending", count: pending, color: STATUS_COLORS.pending },
    { label: "In Progress", count: inProgress, color: STATUS_COLORS.in_progress },
    { label: "Rejected", count: rejected, color: STATUS_COLORS.rejected },
  ].map((row) => ({ ...row, percent: percentOf(row.count, total) }));

  const completion = total ? Math.round((completed / total) * 100) : 0;
  const issuedTemplates = Number(summary?.clearance_types?.issued ?? 0);
  const pendingItems = backlog?.pendingTotal ?? 0;
  const issueItems = backlog?.issueTotal ?? 0;

  return {
    total,
    distribution,
    bottlenecks: backlog?.rows ?? [],
    cards: [
      {
        id: "total",
        label: "TOTAL ISSUED",
        value: total.toLocaleString(),
        sub: issuedTemplates
          ? `${issuedTemplates} issued template${issuedTemplates === 1 ? "" : "s"}`
          : `${Number(summary?.total_students ?? 0).toLocaleString()} students on record`,
        border: "dark-green",
      },
      {
        id: "completion",
        label: "COMPLETION RATE",
        value: `${completion}%`,
        sub: `${completed.toLocaleString()} fully cleared`,
        border: "light-green",
      },
      {
        id: "deficiency",
        label: "OPEN DEFICIENCIES",
        value: issueItems.toLocaleString(),
        sub: "Items flagged with an issue",
        border: "red",
      },
      {
        id: "review",
        label: "AWAITING REVIEW",
        value: pendingItems.toLocaleString(),
        sub: "Items waiting on an office",
        border: "blue",
      },
    ],
  };
}

export default function ExecutiveDashboard() {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [types, setTypes] = useState([]);
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [scope, setScope] = useState("all");
  const [term, setTerm] = useState(null);
  const [view, setView] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [summary, loadedTypes] = await Promise.all([fetchAdminSummary(), fetchClearanceTypes()]);
        const chosen = selectedTypeId != null
          ? loadedTypes.find((item) => String(item.id) === String(selectedTypeId))
          : null;
        const selected = chosen || pickClearanceType(loadedTypes);
        let dashboard = null;
        if (selected?.id != null) {
          try {
            dashboard = await fetchClearanceTypeDashboard(selected.id);
          } catch {
            dashboard = null;
          }
        }

        const reqs = Array.isArray(dashboard?.clearance_type?.requirements)
          ? dashboard.clearance_type.requirements
          : Array.isArray(selected?.requirements)
            ? selected.requirements
            : [];
        const reqIds = reqs.length > 0 ? new Set(reqs.map((req) => Number(req.id))) : null;

        let backlog = { rows: [], pendingTotal: 0, issueTotal: 0 };
        try {
          backlog = await fetchOfficeBacklog(reqIds);
        } catch {
          backlog = { rows: [], pendingTotal: 0, issueTotal: 0 };
        }

        if (cancelled) return;
        setTypes(loadedTypes);
        if (selected?.id != null && selectedTypeId == null) {
          setSelectedTypeId(selected.id);
        }
        setTerm(presentTerm(selected, dashboard));
        setView(buildView(summary, backlog, dashboard));
        setStatus("ready");
      } catch (loadError) {
        if (cancelled) return;
        setError(apiErrorMessage(loadError, "The admin dashboard could not be loaded."));
        setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedTypeId]);

  const isPastType = (type) => Boolean(type?.is_issued && !type?.is_active);
  const scopedTypes = types.filter((type) => {
    if (scope === "active") return !isPastType(type);
    if (scope === "past") return isPastType(type);
    return true;
  });

  const handleScopeChange = (nextScope) => {
    setScope(nextScope);
    const matching = types.filter((type) => {
      if (nextScope === "active") return !isPastType(type);
      if (nextScope === "past") return isPastType(type);
      return true;
    });
    if (matching.length > 0 && !matching.some((item) => String(item.id) === String(selectedTypeId))) {
      setSelectedTypeId(matching[0].id);
    }
  };

  const distribution = view?.distribution ?? [];
  const bottlenecks = view?.bottlenecks ?? [];
  const maxBottleneck = Math.max(1, ...bottlenecks.map((row) => row.total));

  if (status === "loading") {
    return <PortalLoading variant="admin" title="Loading the admin dashboard" detail="Getting clearance totals for this term." />;
  }

  return (
    <div className="dashboard-layout">
      <SidebarPanel term={term} loading={status === "loading"} />

      <div className="dashboard-main">
        {status === "error" && (
          <p className="dashboard-banner" role="alert">
            {error}
          </p>
        )}

        {types.length > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "14px",
              padding: "10px 14px",
              marginBottom: "14px",
            }}
          >
            <div role="group" aria-label="Filter clearance cycles" style={{ display: "inline-flex", gap: "4px", background: "var(--bg-page)", padding: "3px", borderRadius: "10px" }}>
              {[
                { id: "all", label: `All (${types.length})` },
                { id: "active", label: `Active (${types.filter((t) => !isPastType(t)).length})` },
                { id: "past", label: `Past (${types.filter((t) => isPastType(t)).length})` },
              ].map((opt) => {
                const activeOpt = scope === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={activeOpt}
                    onClick={() => handleScopeChange(opt.id)}
                    style={{
                      border: "none",
                      background: activeOpt ? "var(--bg-navbar)" : "transparent",
                      color: activeOpt ? "#ffffff" : "var(--text-secondary)",
                      padding: "6px 11px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", fontWeight: 700, color: "var(--text-secondary)" }}>
              <span>Clearance Cycle:</span>
              <select
                aria-label="Select clearance template for dashboard"
                value={selectedTypeId ?? ""}
                onChange={(event) => setSelectedTypeId(event.target.value)}
                style={{
                  border: "1.5px solid var(--border-color)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  background: "#ffffff",
                  fontFamily: "inherit",
                }}
              >
                {(scopedTypes.length > 0 ? scopedTypes : types).map((t) => (
                  <option key={t.id} value={t.id}>
                    {displayApiText(t.name) || `Template ${t.id}`}
                    {t.academic_year || t.semester ? ` (${[t.academic_year, t.semester].filter(Boolean).join(" · ")})` : ""}
                    {t.is_issued ? (t.is_active ? " — Active" : " — Past") : " — Draft"}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="dashboard-top-row">
          <div className="status-dist-card">
            <h3>Clearance Status Distribution</h3>
            <p className="status-dist-subtitle">Current overview for issued student clearances</p>

            <div className="status-dist-body">
              <div className="status-dist-left">
                <DonutChart
                  segments={distribution.map((row) => ({
                    label: row.label,
                    color: row.color,
                    pct: row.percent / 100,
                  }))}
                />
                <div className="status-dist-total">
                  <span className="status-dist-total-num">{(view?.total ?? 0).toLocaleString()}</span>
                  <span className="status-dist-total-label">total clearances</span>
                </div>
              </div>

              <div className="status-list">
                {distribution.map((row) => (
                  <div key={row.label} className="status-list-item">
                    <span className="status-dot" style={{ background: row.color }} />
                    <span className="status-name">{row.label}</span>
                    <div className="status-bar-wrap">
                      <div
                        className="status-bar-fill"
                        style={{ width: `${row.percent}%`, background: row.color }}
                      />
                    </div>
                    <span className="status-count">{row.count.toLocaleString()}</span>
                    <span className="status-percent">{row.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="stat-cards-grid">
            {(view?.cards ?? []).map((card) => (
              <div
                key={card.id}
                className={
                  "stat-card" +
                  (card.border === "dark-green" ? " border-top-dark-green" : "") +
                  (card.border === "light-green" ? " border-top-light-green" : "") +
                  (card.border === "red" ? " border-top-red" : "") +
                  (card.border === "blue" ? " border-top-blue" : "")
                }
              >
                <span className="stat-card-label">{card.label}</span>
                <span className="stat-card-value">{card.value}</span>
                <span className="stat-card-sub">{card.sub}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bottleneck-card">
          <div className="bottleneck-header">
            <div className="bottleneck-header-left">
              <h3>Office Bottleneck Analysis</h3>
              <p className="bottleneck-subtitle">Unresolved clearance items per office</p>
            </div>
            <div className="bottleneck-legend">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: "var(--bar-green)" }} />
                Pending
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: "var(--bar-red)" }} />
                Has issue
              </div>
            </div>
          </div>

          {bottlenecks.length === 0 ? (
            <p className="bottleneck-empty">No unresolved clearance items.</p>
          ) : (
            <div className="bottleneck-bars">
              {bottlenecks.map((row) => {
                const greenPct = (row.pending / maxBottleneck) * 100;
                const redPct = (row.deficiency / maxBottleneck) * 100;
                return (
                  <div key={row.office} className="bottleneck-row">
                    <span className="bottleneck-office-name">{row.office}</span>
                    <div className="bottleneck-bar-wrap">
                      <div className="bottleneck-bar-green" style={{ width: `${greenPct}%` }} />
                      <div className="bottleneck-bar-red" style={{ width: `${redPct}%` }} />
                    </div>
                    <div className="bottleneck-row-right">
                      <span className="bottleneck-total">{row.total.toLocaleString()}</span>
                      {row.highest && <span className="bottleneck-badge">highest backlog</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
