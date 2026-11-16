import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, FileText, Download } from "lucide-react";
import {
  apiErrorMessage,
  downloadAdminFile,
  fetchAuditLog,
  fetchAuditLogs,
  fetchAuditReport,
} from "../services/portalApi.js";
import PortalLoading from "../../components/PortalLoading.jsx";
import "./AuditLogs.css";

const PAGE_SIZE = 8;
const ACTIONS = ["create", "update", "delete", "cancel", "approve", "reject"];
const ACTION_STYLE = {
  create: { color: "#2d3a1e", bg: "rgba(45,58,30,0.1)", dot: "#2d3a1e" },
  update: { color: "#3a52a0", bg: "rgba(74,100,184,0.12)", dot: "#4a64b8" },
  delete: { color: "#c43a3a", bg: "rgba(196,58,58,0.12)", dot: "#c43a3a" },
  cancel: { color: "#8a5a10", bg: "rgba(196,145,58,0.14)", dot: "#c4913a" },
  approve: { color: "#2f6b25", bg: "rgba(74,124,63,0.13)", dot: "#4a7c3f" },
  reject: { color: "#8a2a2a", bg: "rgba(196,58,58,0.12)", dot: "#c43a3a" },
};

function dateFromRange(range) {
  if (range === "all") return undefined;
  const days = range === "7" ? 7 : range === "90" ? 90 : 30;
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function formatStamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "—", time: "" };
  return {
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" }),
  };
}

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "SY";
}

function auditFilters({ action, query, actorType, range }) {
  return {
    action: action || undefined,
    actor: query || undefined,
    actor_type: actorType || undefined,
    date_from: dateFromRange(range),
  };
}

function prettyValue(value) {
  if (value == null || value === "") return "—";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("");
  const [range, setRange] = useState("30");
  const [actorType, setActorType] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [counts, setCounts] = useState([]);
  const [reportTotal, setReportTotal] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const filters = auditFilters({ action, query, actorType, range });
    fetchAuditReport(filters)
      .then((report) => {
        if (cancelled) return;
        setCounts(Array.isArray(report?.by_action) ? report.by_action : []);
        setReportTotal(Number(report?.summary?.total_entries ?? 0));
      })
      .catch(() => {
        if (!cancelled) setCounts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [action, query, actorType, range]);

  useEffect(() => {
    let cancelled = false;
    const filters = auditFilters({ action, query, actorType, range });
    fetchAuditLogs({ ...filters, current_page: page, per_page: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        setRows(result.items);
        setTotal(result.total);
        setPages(Math.max(1, result.pages));
        setSelectedId((current) => (
          result.items.some((item) => item.id === current) ? current : result.items[0]?.id ?? null
        ));
        setError("");
      })
      .catch((loadError) => {
        if (cancelled) return;
        setRows([]);
        setError(apiErrorMessage(loadError, "The audit log could not be loaded."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [action, query, actorType, range, page]);

  useEffect(() => {
    if (!selectedId) return undefined;
    let cancelled = false;
    fetchAuditLog(selectedId)
      .then((entry) => {
        if (!cancelled) setDetail(entry);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function exportReport(kind) {
    const filters = auditFilters({ action, query, actorType, range });
    setExporting(kind);
    setError("");
    try {
      await downloadAdminFile(
        kind === "pdf" ? "audit-logs/report/pdf/" : "audit-logs/report/excel/",
        kind === "pdf" ? "audit-report.pdf" : "audit-report.xlsx",
        filters,
      );
    } catch (exportError) {
      setError(exportError.message || "The report could not be exported.");
    } finally {
      setExporting("");
    }
  }

  const selected = rows.find((row) => row.id === selectedId) || null;
  const styleFor = (value) => ACTION_STYLE[value] || ACTION_STYLE.update;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const changes = detail
    ? [...new Set([...Object.keys(detail.old_values || {}), ...Object.keys(detail.new_values || {})])]
    : [];

  if (loading && rows.length === 0 && !error) {
    return (
      <PortalLoading
        title="Loading audit logs"
        detail="Getting the latest recorded account and clearance changes."
      />
    );
  }

  return (
    <div className="al2-page">
      <div className="al2-header">
        <div>
          <h1 className="al2-title">Audit Logs</h1>
          <p className="al2-sub">Recorded account and clearance changes, newest first</p>
        </div>
        <div className="al2-header-actions">
          <button type="button" className="al2-btn-outline" onClick={() => exportReport("pdf")} disabled={Boolean(exporting)}>
            <FileText size={14} /> {exporting === "pdf" ? "Exporting…" : "Export PDF Summary"}
          </button>
          <button type="button" className="al2-btn-dark" onClick={() => exportReport("excel")} disabled={Boolean(exporting)}>
            <Download size={14} /> {exporting === "excel" ? "Exporting…" : "Export Spreadsheet (Excel)"}
          </button>
        </div>
      </div>

      {error && <p className="al2-banner" role="alert">{error}</p>}

      <div className="al2-filter-bar">
        <div className="al2-search-wrap">
          <Search size={13} className="al2-search-icon" />
          <input
            className="al2-search"
            placeholder="Search the acting user"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          />
        </div>
        <select className="al2-select" value={range} onChange={(event) => { setRange(event.target.value); setPage(1); }}>
          <option value="30">Last 30 days</option>
          <option value="7">Last 7 days</option>
          <option value="90">Last 90 days</option>
          <option value="all">All time</option>
        </select>
        <select className="al2-select" value={actorType} onChange={(event) => { setActorType(event.target.value); setPage(1); }}>
          <option value="">All actors</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="student">Student</option>
          <option value="system">System</option>
        </select>
      </div>

      <div className="al2-type-tabs">
        <span className="al2-tabs-label">ACTION TYPE</span>
        <button type="button" className={"al2-tab" + (action === "" ? " active" : "")} onClick={() => { setAction(""); setPage(1); }}>
          All
          <span className="al2-tab-count">{reportTotal.toLocaleString()}</span>
        </button>
        {(counts.length ? counts : ACTIONS.map((value) => ({ value, label: value, count: 0 }))).map((item) => (
          <button
            key={item.value}
            type="button"
            className={"al2-tab" + (action === item.value ? " active" : "")}
            onClick={() => { setAction(item.value); setPage(1); }}
          >
            <span className="al2-tab-dot" style={{ background: styleFor(item.value).dot }} />
            {item.label || item.value}
            <span className="al2-tab-count">{Number(item.count ?? 0).toLocaleString()}</span>
          </button>
        ))}
        <span className="al2-entries-count">{total.toLocaleString()} entries</span>
      </div>

      <div className="al2-split">
        <div className="al2-table-wrap">
          <div className="table-scroll">
            <table className="al2-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Actor type</th>
                  <th>Action</th>
                  <th>Record</th>
                  <th>System</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={6} className="al2-empty">No logs match your search.</td></tr>
                ) : (
                  rows.map((log) => {
                    const stamp = formatStamp(log.created_at);
                    const typeCfg = styleFor(log.action);
                    const name = log.actor_full_name || log.actor_username || "System";
                    return (
                      <tr
                        key={log.id}
                        className={"al2-tr" + (selectedId === log.id ? " selected" : "")}
                        onClick={() => setSelectedId(log.id)}
                      >
                        <td className="al2-ts">
                          <div className="al2-ts-date">{stamp.date}</div>
                          <div className="al2-ts-time">{stamp.time}</div>
                        </td>
                        <td>
                          <div className="al2-actor-cell">
                            <div className="al2-avatar">{initials(name)}</div>
                            <span className="al2-actor-name">{name}</span>
                          </div>
                        </td>
                        <td><span className="al2-role-pill">{log.actor_type || "—"}</span></td>
                        <td>
                          <span className="al2-action-badge" style={{ background: typeCfg.bg, color: typeCfg.color }}>
                            <span className="al2-action-dot" style={{ background: typeCfg.dot }} />
                            {log.action}
                          </span>
                        </td>
                        <td>
                          <div className="al2-target-name">{log.entity_type}</div>
                          <div className="al2-target-id">{log.entity_id}</div>
                        </td>
                        <td className="al2-notes">{log.system}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="al2-pagination">
            <span className="al2-page-info">Showing {rangeStart}–{rangeEnd} of {total.toLocaleString()} entries</span>
            <div className="al2-page-btns">
              <button type="button" className="al2-page-btn" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>
                <ChevronLeft size={14} />
              </button>
              <button type="button" className="al2-page-btn active">{page}</button>
              <button type="button" className="al2-page-btn" onClick={() => setPage((value) => Math.min(pages, value + 1))} disabled={page === pages}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="al2-detail-pane">
          {selected ? (
            <>
              <div className="al2-detail-header">
                <span className="al2-detail-label">LOG ENTRY</span>
                <span className="al2-detail-type-badge" style={{ background: styleFor(selected.action).bg, color: styleFor(selected.action).color }}>
                  {selected.action}
                </span>
              </div>
              <div className="al2-detail-id">#{selected.id}</div>
              <div className="al2-detail-actor">
                <div className="al2-avatar lg">{initials(detail?.actor_full_name || selected.actor_full_name)}</div>
                <div>
                  <div className="al2-detail-actor-name">{detail?.actor_full_name || selected.actor_full_name || "System"}</div>
                  <div className="al2-detail-actor-role">{detail?.actor_username || selected.actor_username || "No username"} · {selected.actor_type}</div>
                </div>
              </div>
              <div className="al2-detail-fields">
                <div className="al2-detail-field">
                  <span className="al2-field-label">Recorded</span>
                  <span className="al2-field-value">{formatStamp(selected.created_at).date} · {formatStamp(selected.created_at).time}</span>
                </div>
                <div className="al2-detail-field">
                  <span className="al2-field-label">Record</span>
                  <span className="al2-field-value">{selected.entity_type}<br /><small className="al2-field-sub">{selected.entity_id}</small></span>
                </div>
                <div className="al2-detail-field">
                  <span className="al2-field-label">System</span>
                  <span className="al2-field-value">{selected.system}</span>
                </div>
                {changes.map((field) => (
                  <div key={field} className="al2-detail-field">
                    <span className="al2-field-label">{field}</span>
                    <span className="al2-field-value">
                      {prettyValue(detail?.old_values?.[field])} → {prettyValue(detail?.new_values?.[field])}
                    </span>
                  </div>
                ))}
              </div>
              <div className="al2-detail-footer-note">Entries are read-only.</div>
            </>
          ) : (
            <div className="al2-no-detail"><p>Select a log entry to view details.</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
