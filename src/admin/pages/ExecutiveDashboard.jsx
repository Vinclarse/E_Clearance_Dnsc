import { useEffect, useState } from "react";
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

function buildView(summary, backlog) {
  const counts = summary?.student_clearances ?? {};
  const total = Number(counts.total ?? 0);
  const completed = Number(counts.completed ?? 0);
  const pending = Number(counts.pending ?? 0);
  const inProgress = Number(counts.in_progress ?? 0);
  const rejected = Number(counts.rejected ?? 0);
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
  const [term, setTerm] = useState(null);
  const [view, setView] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [summary, types] = await Promise.all([fetchAdminSummary(), fetchClearanceTypes()]);
        const selected = pickClearanceType(types);
        let dashboard = null;
        if (selected?.id != null) {
          try {
            dashboard = await fetchClearanceTypeDashboard(selected.id);
          } catch {
            dashboard = null;
          }
        }

        let backlog = { rows: [], pendingTotal: 0, issueTotal: 0 };
        try {
          backlog = await fetchOfficeBacklog();
        } catch {
          backlog = { rows: [], pendingTotal: 0, issueTotal: 0 };
        }

        if (cancelled) return;
        setTerm(presentTerm(selected, dashboard));
        setView(buildView(summary, backlog));
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
  }, []);

  const distribution = view?.distribution ?? [];
  const bottlenecks = view?.bottlenecks ?? [];
  const maxBottleneck = Math.max(1, ...bottlenecks.map((row) => row.total));

  return (
    <div className="dashboard-layout">
      <SidebarPanel term={term} loading={status === "loading"} />

      <div className="dashboard-main">
        {status === "loading" && <p className="dashboard-loading">Loading campus clearance totals…</p>}
        {status === "error" && (
          <p className="dashboard-banner" role="alert">
            {error}
          </p>
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
