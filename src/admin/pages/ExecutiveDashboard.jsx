import SidebarPanel from "../components/SidebarPanel.jsx";
import { statusDistribution, statCards, bottleneckData } from "../data/mockData.js";
import "./ExecutiveDashboard.css";

const maxBottleneck = Math.max(...bottleneckData.map((d) => d.total));

/* ── SVG Donut Chart ── */
function DonutChart() {
  const cx = 60, cy = 60, r = 46, strokeWidth = 18;
  const C = 2 * Math.PI * r; // ≈ 289.03
  const gap = 3; // px gap between segments

  // Segment lengths (% of circumference) with gap subtracted
  const segments = [
    { color: "#5a7a3a", pct: 0.435 }, // Completed  — olive green
    { color: "#c4913a", pct: 0.331 }, // Pending    — amber
    { color: "#c47a3a", pct: 0.097 }, // Under Review — orange
    { color: "#c43a3a", pct: 0.137 }, // Deficiency — red
  ].map((s) => ({ ...s, len: C * s.pct - gap }));

  // Cumulative offsets
  let cumulative = 0;
  const positioned = segments.map((s) => {
    const offset = cumulative;
    cumulative += s.len + gap;
    return { ...s, offset };
  });

  return (
    <svg
      width="130"
      height="130"
      viewBox="0 0 120 120"
      className="donut-svg"
    >
      {/* Background track */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="#ece9e1"
        strokeWidth={strokeWidth}
      />
      {/* Coloured segments — group rotated so segments start at 12 o'clock */}
      <g transform={`rotate(-90, ${cx}, ${cy})`}>
        {positioned.map((s, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${s.len} ${C - s.len}`}
            strokeDashoffset={-s.offset}
            strokeLinecap="butt"
          />
        ))}
      </g>
    </svg>
  );
}

export default function ExecutiveDashboard() {
  return (
    <div className="dashboard-layout">
      <SidebarPanel />

      <div className="dashboard-main">

        {/* ── Top Row ── */}
        <div className="dashboard-top-row">

          {/* Status Distribution Card */}
          <div className="status-dist-card">
            <h3>Clearance Status Distribution</h3>
            <p className="status-dist-subtitle">Current term overview for all issued clearances</p>

            <div className="status-dist-body">
              {/* Left: donut + total */}
              <div className="status-dist-left">
                <DonutChart />
                <div className="status-dist-total">
                  <span className="status-dist-total-num">1,240</span>
                  <span className="status-dist-total-label">total clearances</span>
                </div>
              </div>

              {/* Right: status list with progress bars */}
              <div className="status-list">
                {statusDistribution.map((s) => (
                  <div key={s.label} className="status-list-item">
                    <span className="status-dot" style={{ background: s.color }} />
                    <span className="status-name">{s.label}</span>
                    <div className="status-bar-wrap">
                      <div
                        className="status-bar-fill"
                        style={{ width: s.percent + "%", background: s.color }}
                      />
                    </div>
                    <span className="status-count">{s.count}</span>
                    <span className="status-percent">{s.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stat cards 2×2 */}
          <div className="stat-cards-grid">
            {statCards.map((c) => (
              <div
                key={c.id}
                className={
                  "stat-card" +
                  (c.border === "dark-green"  ? " border-top-dark-green"  : "") +
                  (c.border === "light-green" ? " border-top-light-green" : "") +
                  (c.border === "red"         ? " border-top-red"         : "") +
                  (c.border === "blue"        ? " border-top-blue"        : "")
                }
              >
                <span className="stat-card-label">{c.label}</span>
                <span className="stat-card-value">{c.value}</span>
                <span className="stat-card-sub">{c.sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Office Bottleneck Card ── */}
        <div className="bottleneck-card">
          <div className="bottleneck-header">
            <div className="bottleneck-header-left">
              <h3>Office Bottleneck Analysis</h3>
              <p className="bottleneck-subtitle">Unresolved clearance items per office</p>
            </div>
            <div className="bottleneck-legend">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: "var(--bar-green)" }} />
                Pending / Under Review
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: "var(--bar-red)" }} />
                Deficiency
              </div>
            </div>
          </div>

          <div className="bottleneck-bars">
            {bottleneckData.map((d) => {
              const greenPct = (d.pending    / maxBottleneck) * 100;
              const redPct   = (d.deficiency / maxBottleneck) * 100;
              return (
                <div key={d.office} className="bottleneck-row">
                  <span className="bottleneck-office-name">{d.office}</span>
                  <div className="bottleneck-bar-wrap">
                    <div className="bottleneck-bar-green" style={{ width: greenPct + "%" }} />
                    <div className="bottleneck-bar-red"   style={{ width: redPct   + "%" }} />
                  </div>
                  <div className="bottleneck-row-right">
                    <span className="bottleneck-total">{d.total}</span>
                    {d.highest && <span className="bottleneck-badge">highest backlog</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
