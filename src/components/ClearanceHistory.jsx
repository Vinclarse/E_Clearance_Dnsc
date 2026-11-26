import { useState } from "react";
import { displayApiText, formatClearanceTerm } from "../services/clearanceDisplay";

function statusTone(status) {
  const key = String(status || "pending").toLowerCase().replace(/[\s-]+/g, "_");
  if (key === "completed" || key === "cleared") {
    return { label: "COMPLETED", bg: "#E5F3E8", color: "#458469", isPast: true };
  }
  if (key === "has_issue" || key === "deficiency") {
    return { label: "DEFICIENCY", bg: "#FAE8E5", color: "#AA5757", isPast: false };
  }
  if (key === "rejected") {
    return { label: "REJECTED", bg: "#FAE8E5", color: "#AA5757", isPast: true };
  }
  if (key === "under_review" || key === "in_progress") {
    return { label: key === "under_review" ? "UNDER REVIEW" : "IN PROGRESS", bg: "#E2F1F7", color: "#3E7E9C", isPast: false };
  }
  return { label: "PENDING", bg: "#FFF3DC", color: "#A77218", isPast: false };
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function isPastClearance(record) {
  const tone = statusTone(record?.overall_status ?? record?.status);
  return tone.isPast || record?.clearance_type_is_active === false;
}

function ClearanceHistory({ clearances = [], activeClearanceId, onSelectClearance }) {
  const [scope, setScope] = useState("all");
  const activeCount = clearances.filter((record) => !isPastClearance(record)).length;
  const pastCount = clearances.length - activeCount;

  const visibleClearances = clearances.filter((record) => {
    if (scope === "active") return !isPastClearance(record);
    if (scope === "past") return isPastClearance(record);
    return true;
  });

  const filters = [
    { id: "all", label: "All", count: clearances.length },
    { id: "active", label: "Active", count: activeCount },
    { id: "past", label: "Past / Completed", count: pastCount },
  ];

  return (
    <div className="tracker-blueprint-layout">
      <div className="tracker-blueprint-main-box" style={{ minHeight: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <p className="panel-eyebrow" style={{ margin: "0 0 4px 0" }}>Academic archive</p>
            <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#2c2d27" }}>Clearance History</h2>
          </div>

          <div role="group" aria-label="Filter clearance records" style={{ display: "inline-flex", flexWrap: "wrap", gap: "6px", maxWidth: "100%", boxSizing: "border-box", backgroundColor: "#F3F5EE", padding: "4px", borderRadius: "12px", border: "1px solid #E2E4D8" }}>
            {filters.map((filter) => {
              const selected = scope === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setScope(filter.id)}
                  style={{
                    flex: "1 1 auto",
                    border: "none",
                    backgroundColor: selected ? "#2E3D28" : "transparent",
                    color: selected ? "#FFFFFF" : "#4E5648",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {filter.label} ({filter.count})
                </button>
              );
            })}
          </div>
        </div>

        <hr className="tracker-blueprint-divider-line" />

        {visibleClearances.length === 0 ? (
          <div className="empty-checklist">
            <span className="empty-checklist-mark" aria-hidden="true">✓</span>
            <strong>{clearances.length === 0 ? "No clearance records yet" : `No ${scope} clearances`}</strong>
            <span>
              {clearances.length === 0
                ? "Your current and past academic term clearances will appear here once issued."
                : "Try switching the filter above to view your other clearance terms."}
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {visibleClearances.map((record) => {
              const rawStatus = record.overall_status ?? record.status;
              const tone = statusTone(rawStatus);
              const isSelected = String(record.id) === String(activeClearanceId);
              const items = Array.isArray(record.items) ? record.items : [];
              const clearedCount = items.filter(
                (item) => String(item.status || "").toLowerCase() === "cleared",
              ).length;
              const completedDate = formatDate(record.completed_at || record.date_completed);
              const termLabel = formatClearanceTerm(record) || "Term information unavailable";

              return (
                <article
                  key={record.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "16px",
                    padding: "18px 20px",
                    borderRadius: "16px",
                    backgroundColor: isSelected ? "#F5F8F2" : "#FFFFFF",
                    border: isSelected ? "1.5px solid #5F774B" : "1px solid #E2E4D8",
                  }}
                >
                  <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "6px" }}>
                      <h3 style={{ margin: 0, fontSize: "1rem", color: "#2c2d27" }}>
                        {displayApiText(record.clearance_type_name) || "Semestral Clearance"}
                      </h3>
                      <span
                        style={{
                          backgroundColor: tone.bg,
                          color: tone.color,
                          padding: "3px 10px",
                          borderRadius: "999px",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                        }}
                      >
                        {tone.label}
                      </span>
                      {isSelected && (
                        <span
                          style={{
                            backgroundColor: "#2E3D28",
                            color: "#FFFFFF",
                            padding: "3px 10px",
                            borderRadius: "999px",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                          }}
                        >
                          Viewing
                        </span>
                      )}
                      {record.is_enrolled && (
                        <span
                          style={{
                            backgroundColor: "#E5F3E8",
                            color: "#458469",
                            padding: "3px 10px",
                            borderRadius: "999px",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                          }}
                        >
                          Validated for Enrollment
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.84rem", color: "#5e6459", display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
                      <span>{termLabel}</span>
                      {items.length > 0 && (
                        <span>{clearedCount} of {items.length} steps cleared</span>
                      )}
                      {completedDate && <span>Completed {completedDate}</span>}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => onSelectClearance?.(record, "dashboard")}
                      style={{
                        border: "1px solid #C8D0C0",
                        backgroundColor: "#FFFFFF",
                        color: "#2c2d27",
                        padding: "8px 14px",
                        borderRadius: "10px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Open Checklist
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectClearance?.(record, "download")}
                      style={{
                        border: "none",
                        backgroundColor: "var(--primary-green)",
                        color: "#FFFFFF",
                        padding: "8px 14px",
                        borderRadius: "10px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Certificate & QR
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClearanceHistory;
