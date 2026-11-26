import { useEffect, useState } from "react";
import { CheckCircle2, Plus, Send, Trash2 } from "lucide-react";
import { displayApiText, formatAcademicYear } from "../../services/clearanceDisplay.js";
import {
  fetchAdminSummary,
  fetchClearanceTypeDashboard,
  fetchClearanceTypes,
  formatYearLevels,
  pickClearanceType,
} from "../services/dashboardApi.js";
import {
  apiErrorMessage,
  createClearanceRequirement,
  createClearanceType,
  deleteClearanceRequirement,
  fetchClearanceRoles,
  issueClearanceType,
  updateClearanceType,
} from "../services/portalApi.js";
import PortalLoading from "../../components/PortalLoading.jsx";
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

function defaultYearLevelsMap() {
  return Object.fromEntries(YEAR_OPTIONS.map((option) => [option.level, true]));
}

export default function ClearanceTemplates() {
  const [types, setTypes] = useState([]);
  const [roles, setRoles] = useState([]);
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

  // Create Template Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newYear, setNewYear] = useState("2026-2027");
  const [newSemester, setNewSemester] = useState("2nd Semester");
  const [newDescription, setNewDescription] = useState("");
  const [newLevels, setNewLevels] = useState(defaultYearLevelsMap);
  const [newActive, setNewActive] = useState(true);
  const [copySteps, setCopySteps] = useState(true);
  const [modalError, setModalError] = useState("");

  // Add Requirement Step Modal
  const [showStepModal, setShowStepModal] = useState(false);
  const [stepName, setStepName] = useState("");
  const [stepRoleId, setStepRoleId] = useState("");
  const [stepOrder, setStepOrder] = useState("1");
  const [stepModalError, setStepModalError] = useState("");

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

  async function reloadTemplate(targetId) {
    const [loadedTypes, summary] = await Promise.all([fetchClearanceTypes(), fetchAdminSummary()]);
    const selected = loadedTypes.find((item) => String(item.id) === String(targetId)) || pickClearanceType(loadedTypes);
    const dashboard = selected?.id != null ? await fetchClearanceTypeDashboard(selected.id) : null;
    setTypes(loadedTypes);
    applyType(selected, dashboard, summary);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [loadedTypes, summary, loadedRoles] = await Promise.all([
          fetchClearanceTypes(),
          fetchAdminSummary(),
          fetchClearanceRoles().catch(() => []),
        ]);
        const selected = pickClearanceType(loadedTypes);
        const dashboard = selected?.id != null ? await fetchClearanceTypeDashboard(selected.id) : null;
        if (cancelled) return;
        setTypes(loadedTypes);
        setRoles(loadedRoles);
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
    setNotice("");
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
      await reloadTemplate(typeId);
      setNotice("Template saved.");
    } catch (saveError) {
      setError(apiErrorMessage(saveError, "The template could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  async function issueTemplate() {
    if (!typeId || issued) return;
    if (steps.length === 0) {
      setError("Add at least one sequential requirement step before issuing this clearance.");
      return;
    }
    if (!window.confirm("Issue this clearance to every eligible student?")) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await issueClearanceType(typeId);
      await reloadTemplate(typeId);
      setNotice("Clearance records have been issued for eligible students.");
    } catch (issueError) {
      setError(apiErrorMessage(issueError, "The clearance could not be issued."));
    } finally {
      setSaving(false);
    }
  }

  function openCreateModal() {
    setNewName("");
    setNewYear(academicYear || "2026-2027");
    setNewSemester(semester === "1st Semester" ? "2nd Semester" : "1st Semester");
    setNewDescription("");
    setNewLevels(defaultYearLevelsMap());
    setNewActive(true);
    setCopySteps(steps.length > 0);
    setModalError("");
    setShowCreateModal(true);
  }

  async function submitCreateTemplate(event) {
    event.preventDefault();
    if (saving) return;
    const selectedLevels = YEAR_OPTIONS.filter((option) => newLevels[option.level]).map((option) => option.level);
    if (!newName.trim() || !newYear.trim() || !newSemester.trim()) {
      setModalError("Clearance title, academic year, and semester are required.");
      return;
    }
    if (selectedLevels.length === 0) {
      setModalError("Select at least one target year level.");
      return;
    }

    setSaving(true);
    setModalError("");
    setError("");
    setNotice("");
    try {
      const created = await createClearanceType({
        name: newName.trim(),
        academic_year: newYear.trim(),
        semester: newSemester.trim(),
        description: newDescription.trim() || null,
        target_year_levels: selectedLevels,
        is_active: newActive,
      });

      if (copySteps && steps.length > 0 && created?.id != null) {
        for (const [index, step] of steps.entries()) {
          const roleIds = Array.isArray(step.authorizing_role_ids) && step.authorizing_role_ids.length > 0
            ? step.authorizing_role_ids
            : step.authorizing_role_id != null
              ? [step.authorizing_role_id]
              : [];
          await createClearanceRequirement({
            clearance_type: created.id,
            name: displayApiText(step.name) || `Step ${index + 1}`,
            authorizing_role: step.authorizing_role_id ?? roleIds[0] ?? null,
            authorizing_role_ids: roleIds,
            order_sequence: Number(step.order_sequence ?? index + 1),
          });
        }
      }

      await reloadTemplate(created?.id);
      setShowCreateModal(false);
      setNotice(
        copySteps && steps.length > 0
          ? `Created "${newName.trim()}" with ${steps.length} sequential step(s).`
          : `Created "${newName.trim()}". Add sequential steps before issuing.`,
      );
    } catch (createError) {
      setModalError(apiErrorMessage(createError, "Could not create the clearance template."));
    } finally {
      setSaving(false);
    }
  }

  function openStepModal() {
    setStepName("");
    setStepRoleId(roles[0]?.id != null ? String(roles[0].id) : "");
    setStepOrder(String(steps.length + 1));
    setStepModalError("");
    setShowStepModal(true);
  }

  async function submitAddStep(event) {
    event.preventDefault();
    if (!typeId || saving) return;
    const orderNum = Number(stepOrder);
    if (!stepName.trim()) {
      setStepModalError("Step name is required.");
      return;
    }
    if (!Number.isInteger(orderNum) || orderNum < 1) {
      setStepModalError("Order sequence must be a positive whole number.");
      return;
    }

    setSaving(true);
    setStepModalError("");
    setError("");
    try {
      const roleId = stepRoleId ? Number(stepRoleId) : null;
      await createClearanceRequirement({
        clearance_type: typeId,
        name: stepName.trim(),
        authorizing_role: roleId,
        authorizing_role_ids: roleId != null ? [roleId] : [],
        order_sequence: orderNum,
      });
      await reloadTemplate(typeId);
      setShowStepModal(false);
      setNotice(`Added "${stepName.trim()}" (Step ${orderNum}).`);
    } catch (stepError) {
      setStepModalError(apiErrorMessage(stepError, "Could not add requirement step."));
    } finally {
      setSaving(false);
    }
  }

  async function removeStep(step) {
    if (!step?.id || issued || saving) return;
    if (!window.confirm(`Remove "${displayApiText(step.name) || "this step"}"?`)) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await deleteClearanceRequirement(step.id);
      await reloadTemplate(typeId);
      setNotice("Requirement step removed.");
    } catch (deleteError) {
      setError(apiErrorMessage(deleteError, "Could not remove requirement step."));
    } finally {
      setSaving(false);
    }
  }

  const yearText = formatYearLevels(checkedLevels);

  if (loading && !title && !error) {
    return (
      <PortalLoading
        variant="templates"
        title="Loading clearance templates"
        detail="Getting the issued template, its steps, and who it covers."
      />
    );
  }

  return (
    <div className="ct-page">
      <div className="ct-config-card">
        <div className="ct-config-top">
          <div className="ct-config-title-row">
            <h2 className="ct-config-title">Template Configuration</h2>
            <span className="ct-draft-badge">{issued ? "ISSUED" : active ? "ACTIVE" : "DRAFT"}</span>
          </div>
          <div className="ct-top-actions">
            <button type="button" className="ct-btn-save-draft" onClick={saveTemplate} disabled={saving || !typeId}>
              {saving ? "Saving…" : "Save template"}
            </button>
            <button type="button" className="ct-btn-new-template" onClick={openCreateModal} disabled={saving}>
              <Plus size={14} />
              New template
            </button>
          </div>
        </div>

        {types.length > 0 && (
          <label className="ct-label" style={{ display: "block", marginBottom: 12 }}>
            Template
            <select className="ct-select" style={{ marginTop: 5 }} value={typeId ?? ""} onChange={(event) => selectType(event.target.value)}>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {displayApiText(type.name) || `Template ${type.id}`}
                  {type.academic_year || type.semester ? ` (${[type.academic_year, type.semester].filter(Boolean).join(" · ")})` : ""}
                  {type.is_issued ? " — Issued" : " — Draft"}
                </option>
              ))}
            </select>
          </label>
        )}

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
            {!issued && typeId && (
              <button type="button" className="ct-reorder-btn" onClick={openStepModal} disabled={saving}>
                <Plus size={13} />
                Add step
              </button>
            )}
          </div>
          <div className="ct-steps">
            {steps.length === 0 ? (
              <p className="ct-builder-sub">This template has no requirements yet. Add steps before issuing.</p>
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
                  {!issued && step.id != null && (
                    <button
                      type="button"
                      className="ct-step-remove-btn"
                      aria-label={`Remove ${displayApiText(step.name) || "step"}`}
                      title="Remove step"
                      disabled={saving}
                      onClick={() => removeStep(step)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
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

      {showCreateModal && (
        <div className="ct-modal-overlay" onClick={() => !saving && setShowCreateModal(false)}>
          <div className="ct-modal-card" role="dialog" aria-modal="true" aria-labelledby="ct-create-modal-title" onClick={(event) => event.stopPropagation()}>
            <h3 id="ct-create-modal-title" className="ct-modal-title">Create Clearance Template</h3>
            <p className="ct-modal-sub">Define a new clearance cycle and optionally copy your current sequential steps.</p>

            <form className="ct-modal-form" onSubmit={submitCreateTemplate}>
              <div className="ct-form-field">
                <label className="ct-label" htmlFor="ct-new-name">Clearance Title</label>
                <input
                  id="ct-new-name"
                  className="ct-text-input"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="e.g., 2nd Semester Clearance"
                />
              </div>
              <div className="ct-modal-row">
                <div className="ct-form-field">
                  <label className="ct-label" htmlFor="ct-new-year">Academic Year</label>
                  <input
                    id="ct-new-year"
                    className="ct-text-input"
                    value={newYear}
                    onChange={(event) => setNewYear(event.target.value)}
                    placeholder="2026-2027"
                  />
                </div>
                <div className="ct-form-field">
                  <label className="ct-label" htmlFor="ct-new-sem">Semester</label>
                  <input
                    id="ct-new-sem"
                    className="ct-text-input"
                    value={newSemester}
                    onChange={(event) => setNewSemester(event.target.value)}
                    placeholder="2nd Semester"
                  />
                </div>
              </div>
              <div className="ct-form-field">
                <label className="ct-label" htmlFor="ct-new-desc">Description (Optional)</label>
                <input
                  id="ct-new-desc"
                  className="ct-text-input"
                  value={newDescription}
                  onChange={(event) => setNewDescription(event.target.value)}
                  placeholder="Optional notes for this clearance"
                />
              </div>
              <div className="ct-form-field">
                <label className="ct-label">Target Student Year Levels</label>
                <div className="ct-year-checkboxes">
                  {YEAR_OPTIONS.map((option) => (
                    <label key={option.level} className={"ct-year-chip" + (newLevels[option.level] ? " checked" : "")}>
                      <input
                        type="checkbox"
                        className="ct-checkbox"
                        checked={Boolean(newLevels[option.level])}
                        onChange={() => setNewLevels((current) => ({ ...current, [option.level]: !current[option.level] }))}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
              <label className="ct-modal-checkbox">
                <input
                  type="checkbox"
                  checked={newActive}
                  onChange={(event) => setNewActive(event.target.checked)}
                />
                Mark template as active immediately
              </label>
              {steps.length > 0 && (
                <label className="ct-modal-checkbox">
                  <input
                    type="checkbox"
                    checked={copySteps}
                    onChange={(event) => setCopySteps(event.target.checked)}
                  />
                  Copy {steps.length} sequential step(s) from current template
                </label>
              )}
              {modalError && <p className="ct-banner ct-banner--error" role="alert">{modalError}</p>}
              <div className="ct-modal-actions">
                <button type="button" className="ct-btn-save-draft" disabled={saving} onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="ct-btn-new-template" disabled={saving}>
                  {saving ? "Creating…" : "Create Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStepModal && (
        <div className="ct-modal-overlay" onClick={() => !saving && setShowStepModal(false)}>
          <div className="ct-modal-card" role="dialog" aria-modal="true" aria-labelledby="ct-step-modal-title" onClick={(event) => event.stopPropagation()}>
            <h3 id="ct-step-modal-title" className="ct-modal-title">Add Sequential Requirement</h3>
            <p className="ct-modal-sub">Assign a requirement name, authorizing office role, and sequence position.</p>

            <form className="ct-modal-form" onSubmit={submitAddStep}>
              <div className="ct-form-field">
                <label className="ct-label" htmlFor="ct-step-name">Requirement Name</label>
                <input
                  id="ct-step-name"
                  className="ct-text-input"
                  value={stepName}
                  onChange={(event) => setStepName(event.target.value)}
                  placeholder="e.g., Library Clearance"
                />
              </div>
              <div className="ct-modal-row">
                <div className="ct-form-field">
                  <label className="ct-label" htmlFor="ct-step-role">Authorizing Role</label>
                  <select
                    id="ct-step-role"
                    className="ct-select"
                    value={stepRoleId}
                    onChange={(event) => setStepRoleId(event.target.value)}
                  >
                    <option value="">Select role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {displayApiText(role.name) || `Role ${role.id}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ct-form-field">
                  <label className="ct-label" htmlFor="ct-step-order">Step Order</label>
                  <input
                    id="ct-step-order"
                    type="number"
                    min="1"
                    className="ct-text-input"
                    value={stepOrder}
                    onChange={(event) => setStepOrder(event.target.value)}
                  />
                </div>
              </div>
              {stepModalError && <p className="ct-banner ct-banner--error" role="alert">{stepModalError}</p>}
              <div className="ct-modal-actions">
                <button type="button" className="ct-btn-save-draft" disabled={saving} onClick={() => setShowStepModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="ct-btn-new-template" disabled={saving}>
                  {saving ? "Adding…" : "Add Step"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
