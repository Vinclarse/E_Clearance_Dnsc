import { useState, useMemo } from "react";
import { Search, Download, Upload, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import "./StudentDirectory.css";

const YEAR_STATS = [
  { yr: 1, label: "1st Year", count: 340, pct: "27%" },
  { yr: 2, label: "2nd Year", count: 310, pct: "25%" },
  { yr: 3, label: "3rd Year", count: 320, pct: "28%" },
  { yr: 4, label: "4th Year", count: 270, pct: "22%" },
];

const STATUS_CFG = {
  Enrolled:       { label: "Enrolled",     bg: "rgba(74,124,63,0.13)",  color: "#2f6b25", dot: "#4a7c3f" },
  "Not Enrolled": { label: "Not Enrolled", bg: "rgba(107,117,96,0.12)", color: "#555f4a", dot: "#8a9280" },
  "On Leave":     { label: "On Leave",     bg: "rgba(74,100,184,0.12)", color: "#3a52a0", dot: "#4a64b8" },
};

const AVATAR_COLORS = [
  "#7a9a5a","#5a7a9a","#9a7a5a","#7a5a9a",
  "#5a9a7a","#9a5a5a","#7a9a7a","#5a7a7a",
  "#9a9a5a","#5a5a9a",
];

const ALL_STUDENTS = [
  { id:"2024-00101", name:"Ana Reyes",       initials:"AR", program:"BSIT", year:"3rd Year", section:"A", status:"Enrolled" },
  { id:"2024-00117", name:"Luis Dela Cruz",  initials:"LD", program:"BSIT", year:"3rd Year", section:"A", status:"Enrolled" },
  { id:"2024-00132", name:"Carla Mendoza",   initials:"CM", program:"BSIS", year:"2nd Year", section:"B", status:"Enrolled" },
  { id:"2024-00145", name:"Mark Villanueva", initials:"MV", program:"BSIT", year:"3rd Year", section:"C", status:"Not Enrolled" },
  { id:"2024-00158", name:"Joy Ramirez",     initials:"JR", program:"BSIS", year:"2nd Year", section:"A", status:"Enrolled" },
  { id:"2024-00163", name:"Rico Santos",     initials:"RS", program:"BSIT", year:"3rd Year", section:"B", status:"Enrolled" },
  { id:"2024-00189", name:"Paolo Garcia",    initials:"PG", program:"BSIS", year:"2nd Year", section:"B", status:"Not Enrolled" },
  { id:"2024-00226", name:"Elena Cruz",      initials:"EC", program:"BSIS", year:"2nd Year", section:"A", status:"On Leave" },
  { id:"2024-00231", name:"Marco Dizon",     initials:"MD", program:"BSED", year:"1st Year", section:"A", status:"Enrolled" },
  { id:"2024-00245", name:"Hannah Lim",      initials:"HL", program:"BEED", year:"1st Year", section:"B", status:"Enrolled" },
  { id:"2024-00260", name:"Felix Reyes",     initials:"FR", program:"BSBA", year:"4th Year", section:"A", status:"Enrolled" },
  { id:"2024-00278", name:"Grace Bautista",  initials:"GB", program:"BSBA", year:"4th Year", section:"B", status:"Enrolled" },
];

const PAGE_SIZE = 8;

export default function StudentDirectory() {
  const [search,        setSearch]        = useState("");
  const [filterProgram, setFilterProgram] = useState("All Programs");
  const [filterSection, setFilterSection] = useState("All Sections");
  const [filterStatus,  setFilterStatus]  = useState("All Statuses");
  const [page,          setPage]          = useState(1);

  const filtered = useMemo(() => {
    return ALL_STUDENTS.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch  = !q || s.name.toLowerCase().includes(q) || s.id.includes(q);
      const matchProgram = filterProgram === "All Programs" || s.program === filterProgram;
      const matchSection = filterSection === "All Sections" || s.section === filterSection;
      const matchStatus  = filterStatus  === "All Statuses" || s.status  === filterStatus;
      return matchSearch && matchProgram && matchSection && matchStatus;
    });
  }, [search, filterProgram, filterSection, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function goPage(p) { setPage(Math.max(1, Math.min(totalPages, p))); }

  return (
    <div className="sd2-page">

      {/* ── Header ── */}
      <div className="sd2-header">
        <div>
          <h1 className="sd2-title">Student Directory</h1>
          <p className="sd2-sub">
            Manage student accounts and onboard cohorts &middot; Last import: Nov 03, 2026, 118 students added
          </p>
        </div>
        <div className="sd2-header-actions">
          <button className="sd2-btn-outline"><Download size={14} /> Download Template</button>
          <button className="sd2-btn-dark"><Upload size={14} /> Import Students (Excel/CSV)</button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="sd2-stat-row">
        <div className="sd2-stat-card dark">
          <div className="sd2-stat-dark-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <div className="sd2-stat-num-lg">1,240</div>
            <div className="sd2-stat-label-sm">All Students</div>
          </div>
        </div>

        {YEAR_STATS.map((y) => (
          <div key={y.yr} className="sd2-stat-card light">
            <div className="sd2-stat-yr-num">{y.yr}</div>
            <div className="sd2-stat-yr-info">
              <div className="sd2-stat-num">{y.count}</div>
              <div className="sd2-stat-yr-label">{y.label} &middot; {y.pct}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table card ── */}
      <div className="sd2-table-card">

        {/* Filters */}
        <div className="sd2-filters">
          <div className="sd2-search-wrap">
            <Search size={14} className="sd2-search-icon" />
            <input
              className="sd2-search"
              placeholder="Search by name or Student ID"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <select className="sd2-select" value={filterProgram} onChange={(e) => { setFilterProgram(e.target.value); setPage(1); }}>
            <option>All Programs</option>
            <option>BSIT</option><option>BSIS</option><option>BSBA</option>
            <option>BSED</option><option>BEED</option><option>BSCE</option>
          </select>

          <select className="sd2-select" value={filterSection} onChange={(e) => { setFilterSection(e.target.value); setPage(1); }}>
            <option>All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>

          <select className="sd2-select" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
            <option>All Statuses</option>
            <option>Enrolled</option><option>Not Enrolled</option><option>On Leave</option>
          </select>

          <span className="sd2-count">{filtered.length.toLocaleString()} students</span>
        </div>

        {/* Table */}
        <table className="sd2-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Program</th>
              <th>Year</th>
              <th>Section</th>
              <th>Enrollment Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={7} className="sd2-empty">No students match your search.</td></tr>
            ) : (
              paged.map((s, i) => {
                const cfg         = STATUS_CFG[s.status] || STATUS_CFG["Not Enrolled"];
                const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
                return (
                  <tr key={s.id}>
                    <td className="sd2-td-id">{s.id}</td>
                    <td>
                      <div className="sd2-name-cell">
                        <div className="sd2-avatar" style={{ background: avatarColor }}>{s.initials}</div>
                        <span className="sd2-name">{s.name}</span>
                      </div>
                    </td>
                    <td><span className="sd2-program-pill">{s.program}</span></td>
                    <td className="sd2-td-muted">{s.year}</td>
                    <td className="sd2-td-muted">{s.section}</td>
                    <td>
                      <span className="sd2-status-badge" style={{ background: cfg.bg, color: cfg.color }}>
                        <span className="sd2-status-dot" style={{ background: cfg.dot }} />
                        {cfg.label}
                      </span>
                    </td>
                    <td>
                      <button className="sd2-more-btn"><MoreHorizontal size={15} /></button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="sd2-pagination">
          <span className="sd2-page-info">
            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length.toLocaleString()} students
          </span>
          <div className="sd2-page-btns">
            <button className="sd2-page-btn" onClick={() => goPage(page - 1)} disabled={page === 1}>
              <ChevronLeft size={14} />
            </button>
            {[1, 2, 3].map((p) => p <= totalPages && (
              <button key={p} className={"sd2-page-btn" + (p === page ? " active" : "")} onClick={() => goPage(p)}>{p}</button>
            ))}
            {totalPages > 4 && <span className="sd2-page-ellipsis">...</span>}
            {totalPages > 3 && (
              <button className={"sd2-page-btn" + (page === totalPages ? " active" : "")} onClick={() => goPage(totalPages)}>{totalPages}</button>
            )}
            <button className="sd2-page-btn" onClick={() => goPage(page + 1)} disabled={page === totalPages}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
