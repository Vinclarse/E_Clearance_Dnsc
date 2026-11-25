import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Download, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchAdminSummary, formatYearLevels } from "../services/dashboardApi.js";
import {
  apiErrorMessage,
  downloadAdminFile,
  fetchPrograms,
  fetchStudents,
  uploadStudentInvitations,
} from "../services/portalApi.js";
import PortalLoading from "../../components/PortalLoading.jsx";
import "./StudentDirectory.css";

const PAGE_SIZE = 8;
const STATUS_CFG = {
  enrolled: { label: "Enrolled", bg: "rgba(74,124,63,0.13)", color: "#2f6b25", dot: "#4a7c3f" },
  graduated: { label: "Graduated", bg: "rgba(74,100,184,0.12)", color: "#3a52a0", dot: "#4a64b8" },
  dropped: { label: "Dropped", bg: "rgba(196,58,58,0.12)", color: "#8a2a2a", dot: "#c43a3a" },
  to_be_updated: { label: "Needs update", bg: "rgba(196,145,58,0.14)", color: "#8a5a10", dot: "#c4913a" },
};
const AVATAR_COLORS = ["#7a9a5a", "#5a7a9a", "#9a7a5a", "#7a5a9a", "#5a9a7a", "#9a5a5a"];

function studentName(student) {
  return [student.s_fname, student.s_mname, student.s_lname, student.s_suffix].filter(Boolean).join(" ");
}

function initials(student) {
  const letters = `${student.s_fname?.[0] || ""}${student.s_lname?.[0] || ""}`.toUpperCase();
  return letters || "ST";
}

function programOptionValue(program) {
  return (program.ids || [program.id]).map(String).join(",");
}

function programMatches(program, studentProgram) {
  return (program.ids || [program.id]).some((id) => String(id) === String(studentProgram));
}

const YEAR_OPTIONS = [
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
];

function matchesYear(student, year) {
  return !year || String(student.s_lvl) === String(year);
}

async function fetchStudentsForPrograms(programIds, params) {
  if (!params.s_lvl && programIds.length <= 1) {
    return fetchStudents({ ...params, program: programIds[0] || undefined });
  }

  const collected = [];
  const seen = new Set();
  const sources = programIds.length ? programIds : [undefined];
  for (const program of sources) {
    for (let current = 1; current <= 20; current += 1) {
      const result = await fetchStudents({
        ...params,
        program,
        current_page: current,
        per_page: 100,
      });
      for (const student of result.items) {
        if (!matchesYear(student, params.s_lvl)) continue;
        const key = student.id ?? student.s_studentID;
        if (seen.has(key)) continue;
        seen.add(key);
        collected.push(student);
      }
      if (current >= (result.pages || 1) || result.items.length === 0) break;
    }
  }

  const start = (params.current_page - 1) * params.per_page;
  return {
    items: collected.slice(start, start + params.per_page),
    total: collected.length,
    pages: Math.max(1, Math.ceil(collected.length / params.per_page)),
  };
}

export default function StudentDirectory() {
  const fileRef = useRef(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [programId, setProgramId] = useState("");
  const [section, setSection] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [programs, setPrograms] = useState([]);
  const [sections, setSections] = useState([]);
  const [yearStats, setYearStats] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      fetchPrograms(),
      fetchAdminSummary(),
      fetchStudents({ per_page: 50, current_page: 1 }),
    ]).then(([programResult, summaryResult, sectionResult]) => {
      if (cancelled) return;
      if (programResult.status === "fulfilled") setPrograms(programResult.value);
      if (summaryResult.status === "fulfilled") {
        const summary = summaryResult.value;
        const totalCount = Number(summary?.total_students ?? 0);
        const counts = new Map(
          (summary?.students_by_year_level ?? []).map((row) => [Number(row.year_level), Number(row.count ?? 0)]),
        );
        setTotalStudents(totalCount);
        setYearStats([1, 2, 3, 4].map((level) => {
          const count = counts.get(level) || 0;
          const pct = totalCount ? Math.round((count / totalCount) * 100) : 0;
          return { yr: level, label: formatYearLevels([level]), count, pct: `${pct}%` };
        }));
      }
      if (sectionResult.status === "fulfilled") {
        const values = [...new Set(sectionResult.value.items.map((student) => student.s_set).filter(Boolean))];
        setSections(values.sort());
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchStudentsForPrograms(programId ? programId.split(",").filter(Boolean) : [], {
      current_page: page,
      per_page: PAGE_SIZE,
      search: query || undefined,
      s_set: section || undefined,
      s_lvl: year || undefined,
      s_status: status || undefined,
    })
      .then((result) => {
        if (cancelled) return;
        setRows(result.items);
        setTotal(result.total);
        setPages(Math.max(1, result.pages));
        setError("");
      })
      .catch((loadError) => {
        if (cancelled) return;
        setRows([]);
        setError(apiErrorMessage(loadError, "The student roster could not be loaded."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, query, programId, section, year, status]);

  const pageButtons = useMemo(() => {
    const shown = new Set([1, page - 1, page, page + 1, pages].filter((value) => value >= 1 && value <= pages));
    return [...shown].sort((a, b) => a - b);
  }, [page, pages]);

  if (loading && rows.length === 0 && !error) {
    return (
      <PortalLoading
        variant="table"
        title="Loading the student directory"
        detail="Getting programs, year levels, and the current roster."
      />
    );
  }

  async function downloadTemplate() {
    setNotice("");
    try {
      await downloadAdminFile("admin/student-bulk-invitations/template/", "student-invitations.xlsx");
    } catch (downloadError) {
      setError(downloadError.message || "The template could not be downloaded.");
    }
  }

  async function previewImport(file) {
    setImporting(true);
    setNotice("");
    setError("");
    try {
      const result = await uploadStudentInvitations(file, { dryRun: true });
      setImportFile(file);
      const detail = result?.message && result.message !== "Error" ? result.message : "The file passed the preview check.";
      setNotice(`${detail} Confirm to send the invitations.`);
    } catch (uploadError) {
      setImportFile(null);
      setError(apiErrorMessage(uploadError, "The spreadsheet could not be checked."));
    } finally {
      setImporting(false);
    }
  }

  async function sendImport() {
    if (!importFile) return;
    setImporting(true);
    setError("");
    try {
      const result = await uploadStudentInvitations(importFile, { dryRun: false });
      setImportFile(null);
      setNotice(result?.message && result.message !== "Error" ? result.message : "Student invitations were queued.");
      setPage(1);
    } catch (uploadError) {
      setError(apiErrorMessage(uploadError, "The invitations could not be sent."));
    } finally {
      setImporting(false);
    }
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="sd2-page">
      <div className="sd2-header">
        <div>
          <h1 className="sd2-title">Student Directory</h1>
          <p className="sd2-sub">Institute roster from the student records API</p>
        </div>
        <div className="sd2-header-actions">
          <button type="button" className="sd2-btn-outline" onClick={downloadTemplate}>
            <Download size={14} /> Download Template
          </button>
          <button type="button" className="sd2-btn-dark" onClick={() => fileRef.current?.click()} disabled={importing}>
            <Upload size={14} /> Import Students (Excel/CSV)
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) previewImport(file);
            }}
          />
        </div>
      </div>

      {notice && <p className="sd2-banner">{notice}</p>}
      {error && <p className="sd2-banner sd2-banner--error" role="alert">{error}</p>}
      {importFile && (
        <div className="sd2-banner">
          <span>{importFile.name} is ready.</span>
          <button type="button" className="sd2-btn-dark" onClick={sendImport} disabled={importing}>
            {importing ? "Sending…" : "Send invitations"}
          </button>
        </div>
      )}

      <div className="sd2-stat-row">
        <button
          type="button"
          className={"sd2-stat-card dark sd2-year-card" + (year === "" ? " active" : "")}
          aria-pressed={year === ""}
          onClick={() => { setYear(""); setPage(1); }}
        >
          <div className="sd2-stat-dark-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <div className="sd2-stat-num-lg">{totalStudents.toLocaleString()}</div>
            <div className="sd2-stat-label-sm">All Students</div>
          </div>
        </button>
        {yearStats.map((item) => (
          <button
            key={item.yr}
            type="button"
            className={"sd2-stat-card light sd2-year-card" + (year === String(item.yr) ? " active" : "")}
            aria-pressed={year === String(item.yr)}
            onClick={() => {
              setYear((current) => (current === String(item.yr) ? "" : String(item.yr)));
              setPage(1);
            }}
          >
            <div className="sd2-stat-yr-num">{item.yr}</div>
            <div className="sd2-stat-yr-info">
              <div className="sd2-stat-num">{item.count}</div>
              <div className="sd2-stat-yr-label">{item.label} · {item.pct}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="sd2-table-card">
        <div className="sd2-filters">
          <div className="sd2-search-wrap">
            <Search size={14} className="sd2-search-icon" />
            <input
              className="sd2-search"
              placeholder="Search by name or Student ID"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <select className="sd2-select" value={programId} onChange={(event) => { setProgramId(event.target.value); setPage(1); }}>
            <option value="">All Programs</option>
            {programs.map((program) => (
              <option key={programOptionValue(program)} value={programOptionValue(program)}>{program.acronym}</option>
            ))}
          </select>
          <select className="sd2-select" aria-label="Year" value={year} onChange={(event) => { setYear(event.target.value); setPage(1); }}>
            <option value="">All years</option>
            {YEAR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select className="sd2-select" value={section} onChange={(event) => { setSection(event.target.value); setPage(1); }}>
            <option value="">All Sections</option>
            {sections.map((value) => (
              <option key={value} value={value}>Section {value}</option>
            ))}
          </select>
          <select className="sd2-select" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="">All status</option>
            <option value="enrolled">Enrolled</option>
            <option value="graduated">Graduated</option>
            <option value="dropped">Dropped</option>
            <option value="to_be_updated">Needs update</option>
          </select>
          <span className="sd2-count">{total.toLocaleString()} students</span>
        </div>

        <div className="table-scroll">
          <table className="sd2-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Program</th>
                <th>Year</th>
                <th>Section</th>
                <th>Enrollment Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="sd2-empty">No students match your search.</td></tr>
              ) : (
                rows.map((student, index) => {
                  const cfg = STATUS_CFG[student.s_status] || STATUS_CFG.to_be_updated;
                  const program = programs.find((item) => programMatches(item, student.program));
                  return (
                    <tr key={student.id}>
                      <td className="sd2-td-id">{student.s_studentID}</td>
                      <td>
                        <div className="sd2-name-cell">
                          <div className="sd2-avatar" style={{ background: AVATAR_COLORS[index % AVATAR_COLORS.length] }}>
                            {initials(student)}
                          </div>
                          <span className="sd2-name">{studentName(student)}</span>
                        </div>
                      </td>
                      <td><span className="sd2-program-pill">{program?.acronym || student.program_name}</span></td>
                      <td className="sd2-td-muted">{formatYearLevels([student.s_lvl])}</td>
                      <td className="sd2-td-muted">{student.s_set || "—"}</td>
                      <td>
                        <span className="sd2-status-badge" style={{ background: cfg.bg, color: cfg.color }}>
                          <span className="sd2-status-dot" style={{ background: cfg.dot }} />
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="sd2-pagination">
          <span className="sd2-page-info">
            Showing {rangeStart}–{rangeEnd} of {total.toLocaleString()} students
          </span>
          <div className="sd2-page-btns">
            <button type="button" className="sd2-page-btn" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>
              <ChevronLeft size={14} />
            </button>
            {pageButtons.map((value, index) => (
              <span key={value} style={{ display: "contents" }}>
                {index > 0 && value - pageButtons[index - 1] > 1 && <span className="sd2-page-ellipsis">...</span>}
                <button type="button" className={"sd2-page-btn" + (value === page ? " active" : "")} onClick={() => setPage(value)}>
                  {value}
                </button>
              </span>
            ))}
            <button type="button" className="sd2-page-btn" onClick={() => setPage((value) => Math.min(pages, value + 1))} disabled={page === pages}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
