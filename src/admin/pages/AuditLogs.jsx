import { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, FileText, Download, CheckCircle2 } from "lucide-react";
import "./AuditLogs.css";

/* ── Action type config ── */
const ACTION_TYPES = {
  "All":               { color: "#2d3a1e", bg: "#2d3a1e",   count: 11243 },
  "Signed":            { color: "#3a7a2e", bg: "rgba(74,124,63,0.13)",   dot: "#4a7c3f", count: 7924  },
  "Flagged Deficiency":{ color: "#c43a3a", bg: "rgba(196,58,58,0.12)",   dot: "#c43a3a", count: 1870  },
  "Proof Approved":    { color: "#3a52a0", bg: "rgba(74,100,184,0.12)",  dot: "#4a64b8", count: 1420  },
  "Template Issued":   { color: "#c4913a", bg: "rgba(196,145,58,0.12)",  dot: "#c4913a", count: 29    },
};

const MOCK_LOGS = [
  {
    id: "LOG-2026-118342", timestamp: { date: "Nov 10, 2026", time: "9:42:15 AM" },
    actor: { name: "Prof. Maria Santos", initials: "MS", color: "#6a8f5a", role: "Program Chair" },
    actionType: "Signed", target: { name: "Ana Reyes", id: "2024-00101" },
    notes: "Step 4 of 6 cleared",
    detail: {
      recorded: "Nov 10, 2026 · 9:18:42 AM",
      targetStudent: { name: "Hannah Lim", id: "2024-00104 · BSIT 3-D" },
      requirement: "Step 1 · Library Clearance",
      amountDue: "PHP 150.00",
      remarks: "Unreturned book: Database System Concepts 7th Edition",
      integrity: { verified: true, hash: "4d1f3c7e…d4d2b27d", prevHash: "5bc65c12…713c17a4" },
    },
  },
  {
    id: "LOG-2026-118341", timestamp: { date: "Nov 10, 2026", time: "3:21:05 AM" },
    actor: { name: "Grace Bautista", initials: "GB", color: "#8a6a5a", role: "Cashier" },
    actionType: "Proof Approved", target: { name: "Rico Santos", id: "2024-00163" },
    notes: "Receipt ref: 901234567890 verified",
    detail: null,
  },
  {
    id: "LOG-2026-118340", timestamp: { date: "Nov 10, 2026", time: "9:18:42 AM" },
    actor: { name: "Henry Co", initials: "HC", color: "#5a7a9a", role: "Librarian" },
    actionType: "Flagged Deficiency", target: { name: "Hannah Lim", id: "2024-00004" },
    notes: "Unreturned book · PHP 150.00",
    detail: {
      recorded: "Nov 10, 2026 · 9:18:42 AM",
      targetStudent: { name: "Hannah Lim", id: "2024-00104 · BSIT 3-D" },
      requirement: "Step 1 · Library Clearance",
      amountDue: "PHP 150.00",
      remarks: "Unreturned book: Database System Concepts 7th Edition",
      integrity: { verified: true, hash: "4d1f3c7e…d4d2b27d", prevHash: "5bc65c12…713c17a4" },
    },
  },
  {
    id: "LOG-2026-118339", timestamp: { date: "Nov 10, 2026", time: "5:55:30 AM" },
    actor: { name: "Dr. Elena Ramos", initials: "ER", color: "#9a6a7a", role: "Dean" },
    actionType: "Signed", target: { name: "Marco Dizon", id: "2024-00231" },
    notes: "Step 6 of 6 cleared · certificate generated",
    detail: null,
  },
  {
    id: "LOG-2026-118338", timestamp: { date: "Nov 10, 2026", time: "5:12:09 AM" },
    actor: { name: "Prof. Daniel Ocampo", initials: "DO", color: "#6a7a9a", role: "Program Chair" },
    actionType: "Flagged Deficiency", target: { name: "Paolo Garcia", id: "2024-00189" },
    notes: "Overdue book: Operating System Concepts",
    detail: null,
  },
  {
    id: "LOG-2026-118337", timestamp: { date: "Nov 09, 2026", time: "3:00:51 PM" },
    actor: { name: "Ruth Fernandez", initials: "RF", color: "#9a8a5a", role: "Cashier" },
    actionType: "Flagged Deficiency", target: { name: "Carla Mendoza", id: "2024-00132" },
    notes: "Laboratory fee · PHP 300.00",
    detail: null,
  },
  {
    id: "LOG-2026-118336", timestamp: { date: "Nov 09, 2026", time: "11:28:14 AM" },
    actor: { name: "Ruth Fernandez", initials: "RF", color: "#9a8a5a", role: "Cashier" },
    actionType: "Proof Approved", target: { name: "Gabriel Torres", id: "2024-00219" },
    notes: "Lost equipment · PHP 500.00 settled",
    detail: null,
  },
  {
    id: "LOG-2026-118335", timestamp: { date: "Nov 06, 2026", time: "9:00:02 AM" },
    actor: { name: "Alex Navarro", initials: "AN", color: "#7a5a8a", role: "Administrator" },
    actionType: "Template Issued", target: { name: "4th Year cohort", id: "270 students" },
    notes: "Late issuance · 270 records created",
    detail: null,
  },
];

const PAGE_SIZE = 8;

export default function AuditLogs() {
  const [search,       setSearch]      = useState("");
  const [activeType,   setActiveType]  = useState("All");
  const [selectedLog,  setSelectedLog] = useState(MOCK_LOGS[2]); // start with Flagged Deficiency
  const [page,         setPage]        = useState(1);

  const filtered = useMemo(() => {
    return MOCK_LOGS.filter((l) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        l.actor.name.toLowerCase().includes(q) ||
        l.target.name.toLowerCase().includes(q) ||
        l.notes.toLowerCase().includes(q);
      const matchType = activeType === "All" || l.actionType === activeType;
      return matchSearch && matchType;
    });
  }, [search, activeType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function goPage(p) { setPage(Math.max(1, Math.min(totalPages, p))); }

  const cfg = (type) => ACTION_TYPES[type] || ACTION_TYPES["Signed"];

  return (
    <div className="al2-page">

      {/* ── Header ── */}
      <div className="al2-header">
        <div>
          <h1 className="al2-title">Audit Logs</h1>
          <p className="al2-sub">
            <span className="al2-verified-dot">✓</span>
            Tamper-evident record of all critical transactions · Chain verified today, 9:41 AM
          </p>
        </div>
        <div className="al2-header-actions">
          <button className="al2-btn-outline"><FileText size={14} /> Export PDF Summary</button>
          <button className="al2-btn-dark"><Download size={14} /> Export Spreadsheet (Excel)</button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="al2-filter-bar">
        <div className="al2-search-wrap">
          <Search size={13} className="al2-search-icon" />
          <input
            className="al2-search"
            placeholder="Search actor, student, or note"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="al2-select">
          <option>Last 30 days</option>
          <option>Last 7 days</option>
          <option>Last 90 days</option>
          <option>All time</option>
        </select>
        <select className="al2-select">
          <option>All Office Roles</option>
          <option>Librarian</option>
          <option>Cashier</option>
          <option>Adviser</option>
          <option>Program Chair</option>
          <option>Dean</option>
        </select>
        <select className="al2-select">
          <option>All Actors</option>
        </select>
      </div>

      {/* ── Action type tabs ── */}
      <div className="al2-type-tabs">
        <span className="al2-tabs-label">ACTION TYPE</span>
        {Object.entries(ACTION_TYPES).map(([type, c]) => (
          <button
            key={type}
            className={"al2-tab" + (activeType === type ? " active" : "")}
            onClick={() => { setActiveType(type); setPage(1); }}
            style={activeType === type ? { background: c.bg === "#2d3a1e" ? "#2d3a1e" : "transparent" } : {}}
          >
            {type !== "All" && (
              <span className="al2-tab-dot" style={{ background: c.dot }} />
            )}
            {type}
            <span className="al2-tab-count">{c.count.toLocaleString()}</span>
          </button>
        ))}
        <span className="al2-entries-count">{filtered.length.toLocaleString()} entries</span>
      </div>

      {/* ── Split view: Table + Detail pane ── */}
      <div className="al2-split">

        {/* Left – table */}
        <div className="al2-table-wrap">
          <table className="al2-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Office Role</th>
                <th>Action Type</th>
                <th>Target Student</th>
                <th>System Notes</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={6} className="al2-empty">No logs match your search.</td></tr>
              ) : (
                paged.map((log) => {
                  const typeCfg = cfg(log.actionType);
                  const isSelected = selectedLog?.id === log.id;
                  return (
                    <tr
                      key={log.id}
                      className={"al2-tr" + (isSelected ? " selected" : "")}
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="al2-ts">
                        <div className="al2-ts-date">{log.timestamp.date}</div>
                        <div className="al2-ts-time">{log.timestamp.time}</div>
                      </td>
                      <td>
                        <div className="al2-actor-cell">
                          <div className="al2-avatar" style={{ background: log.actor.color }}>
                            {log.actor.initials}
                          </div>
                          <span className="al2-actor-name">{log.actor.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="al2-role-pill">{log.actor.role}</span>
                      </td>
                      <td>
                        <span className="al2-action-badge" style={{ background: typeCfg.bg, color: typeCfg.color }}>
                          <span className="al2-action-dot" style={{ background: typeCfg.dot }} />
                          {log.actionType}
                        </span>
                      </td>
                      <td>
                        <div className="al2-target-name">{log.target.name}</div>
                        <div className="al2-target-id">{log.target.id}</div>
                      </td>
                      <td className="al2-notes">{log.notes}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="al2-pagination">
            <span className="al2-page-info">
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length.toLocaleString()} entries
            </span>
            <div className="al2-page-btns">
              <button className="al2-page-btn" onClick={() => goPage(page - 1)} disabled={page === 1}>
                <ChevronLeft size={14} />
              </button>
              {[1, 2, 3].map((p) => p <= totalPages && (
                <button key={p} className={"al2-page-btn" + (p === page ? " active" : "")} onClick={() => goPage(p)}>{p}</button>
              ))}
              {totalPages > 4 && <span className="al2-ellipsis">...</span>}
              {totalPages > 3 && (
                <button className={"al2-page-btn" + (page === totalPages ? " active" : "")} onClick={() => goPage(totalPages)}>{totalPages}</button>
              )}
              <button className="al2-page-btn" onClick={() => goPage(page + 1)} disabled={page === totalPages}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right – detail pane */}
        <div className="al2-detail-pane">
          {selectedLog ? (
            <>
              <div className="al2-detail-header">
                <span className="al2-detail-label">LOG ENTRY</span>
                <span
                  className="al2-detail-type-badge"
                  style={{ background: cfg(selectedLog.actionType).bg, color: cfg(selectedLog.actionType).color }}
                >
                  <span className="al2-action-dot" style={{ background: cfg(selectedLog.actionType).dot }} />
                  {selectedLog.actionType}
                </span>
              </div>

              <div className="al2-detail-id">{selectedLog.id}</div>

              {/* Actor block */}
              <div className="al2-detail-actor">
                <div className="al2-avatar lg" style={{ background: selectedLog.actor.color }}>
                  {selectedLog.actor.initials}
                </div>
                <div>
                  <div className="al2-detail-actor-name">{selectedLog.actor.name}</div>
                  <div className="al2-detail-actor-role">{selectedLog.actor.role} · Institute of Computing</div>
                </div>
              </div>

              {/* Detail fields */}
              {selectedLog.detail && (
                <>
                  <div className="al2-detail-fields">
                    <div className="al2-detail-field">
                      <span className="al2-field-label">Recorded</span>
                      <span className="al2-field-value">{selectedLog.detail.recorded}</span>
                    </div>
                    <div className="al2-detail-field">
                      <span className="al2-field-label">Target student</span>
                      <span className="al2-field-value">{selectedLog.detail.targetStudent.name}<br/>
                        <small className="al2-field-sub">{selectedLog.detail.targetStudent.id}</small>
                      </span>
                    </div>
                    <div className="al2-detail-field">
                      <span className="al2-field-label">Requirement</span>
                      <span className="al2-field-value">{selectedLog.detail.requirement}</span>
                    </div>
                    <div className="al2-detail-field">
                      <span className="al2-field-label">Amount due</span>
                      <span className="al2-field-value">{selectedLog.detail.amountDue}</span>
                    </div>
                    <div className="al2-detail-field">
                      <span className="al2-field-label">Remarks</span>
                      <span className="al2-field-value">{selectedLog.detail.remarks}</span>
                    </div>
                  </div>

                  {/* Integrity block */}
                  <div className="al2-integrity-block">
                    <div className="al2-integrity-title">
                      <CheckCircle2 size={15} className="al2-integrity-icon" />
                      Integrity verified
                    </div>
                    <div className="al2-hash-row">
                      <span className="al2-hash-label">ENTRY HASH</span>
                      <span className="al2-hash-value">{selectedLog.detail.integrity.hash}</span>
                    </div>
                    <div className="al2-hash-row">
                      <span className="al2-hash-label">PREVIOUS ENTRY HASH</span>
                      <span className="al2-hash-value">{selectedLog.detail.integrity.prevHash}</span>
                    </div>
                  </div>
                </>
              )}

              {!selectedLog.detail && (
                <div className="al2-no-detail">
                  <p>No additional details available for this log entry.</p>
                </div>
              )}

              <div className="al2-detail-footer-note">
                🔒 Entries are read-only and cannot be edited or deleted.
              </div>
            </>
          ) : (
            <div className="al2-no-detail">
              <p>Select a log entry to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
