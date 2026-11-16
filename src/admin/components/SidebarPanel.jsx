import { useState } from "react";
import { Calendar } from "lucide-react";
import "./SidebarPanel.css";

const filters = ["Today", "Last 7 days", "Last 30 days", "Term to date", "Custom"];

export default function SidebarPanel({ term, loading = false }) {
  const [activeFilter, setActiveFilter] = useState("Term to date");
  const [fromDate, setFromDate] = useState("2026-08-01");
  const [toDate, setToDate] = useState("2026-11-10");
  const approvalChain = term?.chain ?? [];
  const yearLine = [term?.semester, term?.academicYear].filter(Boolean).join(" · ");

  return (
    <aside className="sidebar-panel">
      {/* Term label + badge */}
      <div className="sidebar-term-label">
        <span>Active Term</span>
        <div className={"sidebar-status-badge" + (term?.open ? "" : " sidebar-status-badge--idle")}>
          <span className="sidebar-status-dot" />
          {loading ? "Loading" : term?.statusLabel || "No term"}
        </div>
      </div>

      <h2 className="sidebar-title">{loading ? "Loading clearance…" : term?.title || "No clearance issued"}</h2>
      {yearLine ? <p className="sidebar-year">{yearLine}</p> : null}

      <div className="sidebar-divider" />

      {/* Info rows */}
      <div className="sidebar-info-list">
        <div className="sidebar-info-row">
          <span className="sidebar-info-label">Target year levels:</span>
          <span className="sidebar-info-value">{term?.targetYearLevels || "—"}</span>
        </div>
        <div className="sidebar-info-row">
          <span className="sidebar-info-label">Issued on:</span>
          <span className="sidebar-info-value">{term?.issuedOn || "—"}</span>
        </div>
        <div className="sidebar-info-row">
          <span className="sidebar-info-label">Students issued:</span>
          <span className="sidebar-info-value">{(term?.studentsIssued ?? 0).toLocaleString()}</span>
        </div>
        <div className="sidebar-info-row">
          <span className="sidebar-info-label">Signatory offices:</span>
          <span className="sidebar-info-value">{term?.signatoryOffices ?? 0} sequential steps</span>
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* Approval chain */}
      <p className="sidebar-section-label">Approval Chain</p>
      <div className="sidebar-approval-chain">
        {approvalChain.length === 0 ? (
          <span className="sidebar-chain-empty">{loading ? "Loading steps…" : "No signatory steps yet"}</span>
        ) : (
          approvalChain.map((item) => (
            <div key={`${item.step}-${item.label}`} className="sidebar-chain-step">
              <div className="sidebar-chain-num">{item.step}</div>
              <span className="sidebar-chain-name">{item.label}</span>
            </div>
          ))
        )}
      </div>

      <div className="sidebar-divider" />

      {/* Report period */}
      <p className="sidebar-section-label">Report Period</p>
      <div className="sidebar-filter-row">
        {filters.map((f) => (
          <button
            key={f}
            className={"sidebar-filter-btn" + (activeFilter === f ? " active" : "")}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="sidebar-date-row">
        <div className="sidebar-date-field">
          <span className="sidebar-date-label">From</span>
          <div className="sidebar-date-input-wrap">
            <input
              type="date"
              className="sidebar-date-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <Calendar size={12} className="sidebar-date-icon" />
          </div>
        </div>
        <div className="sidebar-date-field">
          <span className="sidebar-date-label">To</span>
          <div className="sidebar-date-input-wrap">
            <input
              type="date"
              className="sidebar-date-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
            <Calendar size={12} className="sidebar-date-icon" />
          </div>
        </div>
      </div>
      <button className="sidebar-apply-btn">Apply Date Filter</button>
    </aside>
  );
}
