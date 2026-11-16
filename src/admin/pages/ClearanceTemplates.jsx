import { useEffect, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { displayApiText, formatAcademicYear } from "../../services/clearanceDisplay.js";
import {
  fetchAdminSummary,
  fetchClearanceTypeDashboard,
  fetchClearanceTypes,
  formatYearLevels,
  pickClearanceType,
} from "../services/dashboardApi.js";
import { apiErrorMessage, issueClearanceType, updateClearanceType } from "../services/portalApi.js";
import "./ClearanceTemplates.css";

const YEAR_OPTIONS = [
  { level: 1, label: "1st Year" },
  { level: 2, label: "2nd Year" },
  { level: 3, label: "3rd Year" },
  { level: 4, label: "4th Year" },
];

function levelsFromType(type) {
  const selected = new Set((type?.target_year_levels ?? []).map(Number));
  return Object.fromEntries(YEAR_OPTIONS.map((option) => [option.level, selected.has(option.level)]));
}

export default function ClearanceTemplates() {
  const [types, setTypes] = useState([]);
  const [typeId, setTypeId] = useState(null);
  const [title, setTitle] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [yearLevels, setYearLevels] = useState({ 1: false, 2: false, 3: false, 4: false });
  const [issued, setIssued] = useState(false);
  const [active, setActive] = useState(false);
  const [steps, setSteps] = useState([]);
  const [eligible, setEligible] = useState(0);
  const [yearBars, setYearBars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  function applyType(type, dashboard, summary) {
    const clearance = dashboard?.clearance_type ?? type ?? {};
    const requirements = Array.isArray(clearance.requirements) ? clearance.requirements : [];
    setTypeId(clearance.id ?? type?.id ?? null);
    setTitle(displayApiText(clearance.name));
    setAcademicYear(displayApiText(clearance.academic_year).replace(/^ay\s+/i, ""));
    setSemester(displayApiText(clearance.semester));
    setYearLevels(levelsFromType(clearance));
    setIssued(Boolean(clearance.is_issued));
    setActive(Boolean(clearance.is_active));
    setSteps([...requirements].sort((a, b) => Number(a.order_sequence ?? 0) - Number(b.order_sequence ?? 0)));
    const stats = dashboard?.stats ?? {};
    setEligible(Number(
      clearance.is_issued
        ? (stats.issued_students_count ?? 0)
        : (stats.target_students_count ?? summary?.total_students ?? 0),
    ));
    const total = Number(summary?.total_students ?? 0);
    const counts = new Map((summary?.students_by_year_level ?? []).map((row) => [Number(row.year_level), Number(row.count ?? 0)]));
    setYearBars(YEAR_OPTIONS.map((option) => ({
      label: option.label,
      count: counts.get(option.level) || 0,
      width: total ? ((counts.get(option.level) || 0) / total) * 100 : 0,
    })));
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [loadedTypes, summary] = await Promise.all([fetchClearanceTypes(), fetchAdminSummary()]);
        const selected = pickClearanceType(loadedTypes);
        const dashboard = selected?.id != null ? await fetchClearanceTypeDashboard(selected.id) : null;
        if (cancelled) return;
        setTypes(loadedTypes);
        applyType(selected, dashboard, summary);
        setError("");
      } catch (loadError) {
        if (!cancelled) setError(apiErrorMessage(loadError, "Clearance templates could not be loaded."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function selectType(nextId) {
    const selected = types.find((type) => String(type.id) === String(nextId));
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      const [dashboard, summary] = await Promise.all([
        fetchClearanceTypeDashboard(selected.id),
        fetchAdminSummary(),
      ]);
      applyType(selected, dashboard, summary);
    } catch (loadError) {
      setError(apiErrorMessage(loadError, "That template could not be loaded."));
    } finally {
      setLoading(false);
    }
  }

  const checkedLevels = YEAR_OPTIONS.filter((option) => yearLevels[option.level]).map((option) => option.level);

  async function saveTemplate() {
    if (!typeId) return;
    if (!title.trim() || !academicYear.trim() || !semester.trim()) {
      setError("Title, academic year, and semester are required.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await updateClearanceType(typeId, {
        name: title.trim(),
        academic_year: academicYear.trim(),
        semester: semester.trim(),
        target_year_levels: checkedLevels,
        is_active: active,
      });
      setNotice("Template saved.");
    } catch (saveError) {
      setError(apiErrorMessage(saveError, "The template could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  async function issueTemplate() {
    if (!typeId || issued) return;
    if (!window.confirm("Issue this clearance to every eligible student?")) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await issueClearanceType(typeId);
      setIssued(true);
      setNotice("Clearance records are being created for eligible students.");
    } catch (issueError) {
      setError(apiErrorMessage(issueError, "The clearance could not be issued."));
    } finally {
      setSaving(false);
    }
  }

  const yearText = formatYearLevels(checkedLevels);

  return (
    <div className="ct-page">
      <div className="ct-config-card">
        <div className="ct-config-top">
          <div className="ct-config-title-row">
            <h2 className="ct-config-title">Template Configuration</h2>
            <span className="ct-draft-badge">{issued ? "ISSUED" : active ? "ACTIVE" : "DRAFT"}</span>
          </div>
          <button type="button" className="ct-btn-save-draft" onClick={saveTemplate} disabled={saving || !typeId}>
            {saving ? "Saving…" : "Save template"}
          </button>
        </div>

        {types.length > 1 && (
          <label className="ct-label">
            Template
            <select className="ct-select" value={typeId ?? ""} onChange={(event) => selectType(event.target.value)}>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {displayApiText(type.name) || `Template ${type.id}`}
                </option>
              ))}
            </select>
          </label>
        )}

        {loading && <p className="ct-builder-sub">Loading template…</p>}
        {notice && <p className="ct-banner">{notice}</p>}
        {error && <p className="ct-banner ct-banner--error" role="alert">{error}</p>}

        <div className="ct-form-row">
          <div className="ct-form-field ct-field-wide">
            <label className="ct-label">Clearance Title</label>
            <input className="ct-text-input" value={title} placeholder="Clearance title" onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="ct-form-field">
            <label className="ct-label">Academic Year</label>
            <input className="ct-text-input" value={academicYear} placeholder="2026-2027" onChange={(event) => setAcademicYear(event.target.value)} />
          </div>
          <div className="ct-form-field">
            <label className="ct-label">Semester</label>
            <input className="ct-text-input" value={semester} placeholder="1st Semester" onChange={(event) => setSemester(event.target.value)} />
          </div>
          <div className="ct-year-levels-field">
            <label className="ct-label">Target Student Year Levels</label>
            <div className="ct-year-checkboxes">
              {YEAR_OPTIONS.map((option) => (
                <label key={option.level} className={"ct-year-chip" + (yearLevels[option.level] ? " checked" : "")}>
                  <input
                    type="checkbox"
                    className="ct-checkbox"
                    checked={Boolean(yearLevels[option.level])}
                    onChange={() => setYearLevels((current) => ({ ...current, [option.level]: !current[option.level] }))}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="ct-two-col">
        <div className="ct-builder-card">
          <div className="ct-builder-header">
            <div>
              <h3 className="ct-builder-title">Sequential Requirement Builder</h3>
              <p className="ct-builder-sub">Each step unlocks only after the one before it is cleared.</p>
            </div>
          </div>
          <div className="ct-steps">
            {steps.length === 0 ? (
              <p className="ct-builder-sub">This template has no requirements yet.</p>
            ) : (
              steps.map((step, index) => (
                <div key={step.id ?? index} className="ct-step">
                  <div className="ct-step-num">{step.order_sequence ?? index + 1}</div>
                  <div className="ct-step-info">
                    <p className="ct-step-title">{displayApiText(step.name) || "Requirement"}</p>
                    <p className="ct-step-desc">Step {step.order_sequence ?? index + 1}</p>
                  </div>
                  <div className="ct-step-role-block">
                    <span className="ct-step-role-label">Authorizing Role</span>
                    <span className="ct-step-role-pill">{step.authorizing_role_name || "Office"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="ct-builder-footer">
            <span className="ct-step-count">
              <CheckCircle2 size={14} className="ct-check-icon" />
              {steps.length} step{steps.length === 1 ? "" : "s"} configured
            </span>
          </div>
        </div>

        <div className="ct-preview-card">
          <p className="ct-preview-ready">{issued ? "ISSUED" : "READY TO ISSUE"}</p>
          <h3 className="ct-preview-title">{title || "Untitled clearance"}</h3>
          <p className="ct-preview-sub">{formatAcademicYear(academicYear) || "Year not set"} · {semester || "Semester not set"}</p>
          <div className="ct-preview-divider" />
          <div className="ct-preview-info-list">
            <div className="ct-preview-info-row">
              <span className="ct-preview-info-label">Approval chain</span>
              <span className="ct-preview-info-value">{steps.length} sequential steps</span>
            </div>
            <div className="ct-preview-info-row">
              <span className="ct-preview-info-label">Target year levels</span>
              <span className="ct-preview-info-value">{yearText === "—" ? "None" : yearText}</span>
            </div>
            <div className="ct-preview-info-row">
              <span className="ct-preview-info-label">Template status</span>
              <span className="ct-preview-info-value">{issued ? "Issued" : active ? "Active" : "Draft"}</span>
            </div>
          </div>
          <div className="ct-preview-eligible-row">
            <span className="ct-preview-eligible-num">{eligible.toLocaleString()}</span>
            <span className="ct-preview-eligible-label">{issued ? "students issued" : "eligible students"}</span>
          </div>
          <div className="ct-preview-bars-grid">
            {yearBars.map((year) => (
              <div key={year.label} className="ct-preview-bar-item">
                <div className="ct-preview-bar-top">
                  <span className="ct-preview-bar-label">{year.label}</span>
                  <span className="ct-preview-bar-count">{year.count}</span>
                </div>
                <div className="ct-preview-bar-track">
                  <div className="ct-preview-bar-fill" style={{ width: `${year.width}%` }} />
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="ct-preview-issue-btn" onClick={issueTemplate} disabled={saving || issued || !typeId}>
            <Send size={14} />
            {issued ? "Already issued" : "Issue Clearance to Students"}
          </button>
          <p className="ct-preview-note">
            One clearance record is created for every eligible student, and each student is notified automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
