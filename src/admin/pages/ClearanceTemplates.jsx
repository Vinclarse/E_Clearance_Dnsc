import { useState } from "react";
import { Lock, ArrowUpDown, GripVertical, CheckCircle2, Send } from "lucide-react";
import { templateSteps } from "../data/mockData.js";
import "./ClearanceTemplates.css";

const YEAR_BREAKDOWN = [
  { label: "1st Year", count: 340, color: "#7aab5a" },
  { label: "2nd Year", count: 310, color: "#7aab5a" },
  { label: "3rd Year", count: 320, color: "#7aab5a" },
  { label: "4th Year", count: 270, color: "#7aab5a" },
];

export default function ClearanceTemplates() {
  const [title, setTitle]           = useState("Semestral Clearance");
  const [academicYear, setAcademicYear] = useState("2026-2027");
  const [semester, setSemester]     = useState("2nd Semester");
  const [yearLevels, setYearLevels] = useState({
    "1st Year": true, "2nd Year": true, "3rd Year": true, "4th Year": true,
  });

  const toggleYear = (level) =>
    setYearLevels((prev) => ({ ...prev, [level]: !prev[level] }));

  const checkedYears = Object.keys(yearLevels).filter((k) => yearLevels[k]);

  return (
    <div className="ct-page">

      {/* ── Template Configuration Card ── */}
      <div className="ct-config-card">
        <div className="ct-config-top">
          <div className="ct-config-title-row">
            <h2 className="ct-config-title">Template Configuration</h2>
            <span className="ct-draft-badge">DRAFT</span>
          </div>
          <button className="ct-btn-save-draft">Save Draft</button>
        </div>

        <div className="ct-form-row">
          {/* Clearance Title */}
          <div className="ct-form-field ct-field-wide">
            <label className="ct-label">Clearance Title</label>
            <input
              type="text"
              className="ct-text-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Academic Year */}
          <div className="ct-form-field">
            <label className="ct-label">Academic Year</label>
            <select className="ct-select" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
              <option value="2026-2027">2026-2027</option>
              <option value="2025-2026">2025-2026</option>
            </select>
          </div>

          {/* Semester */}
          <div className="ct-form-field">
            <label className="ct-label">Semester</label>
            <select className="ct-select" value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option value="1st Semester">1st Semester</option>
              <option value="2nd Semester">2nd Semester</option>
              <option value="Summer">Summer</option>
            </select>
          </div>

          {/* Year Level checkboxes */}
          <div className="ct-year-levels-field">
            <label className="ct-label">Target Student Year Levels</label>
            <div className="ct-year-checkboxes">
              {Object.keys(yearLevels).map((level) => (
                <label
                  key={level}
                  className={"ct-year-chip" + (yearLevels[level] ? " checked" : "")}
                >
                  <input
                    type="checkbox"
                    className="ct-checkbox"
                    checked={yearLevels[level]}
                    onChange={() => toggleYear(level)}
                  />
                  {level}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="ct-two-col">

        {/* Left – Sequential Requirement Builder */}
        <div className="ct-builder-card">
          <div className="ct-builder-header">
            <div>
              <h3 className="ct-builder-title">Sequential Requirement Builder</h3>
              <p className="ct-builder-sub">Each step unlocks only after the one before it is cleared.</p>
            </div>
            <button className="ct-reorder-btn">
              <ArrowUpDown size={12} />
              Reorder steps
            </button>
          </div>

          <div className="ct-steps">
            {templateSteps.map((step) => (
              <div key={step.id} className="ct-step">
                <span className="ct-drag-handle"><GripVertical size={15} /></span>
                <div className="ct-step-num">{step.id}</div>
                <div className="ct-step-info">
                  <p className="ct-step-title">{step.title}</p>
                  <p className="ct-step-desc">{step.description}</p>
                </div>
                <div className="ct-step-role-block">
                  <span className="ct-step-role-label">Authorizing Role</span>
                  <span className="ct-step-role-pill">{step.role}</span>
                </div>
                <div className="ct-step-note">
                  {step.locked && <Lock size={11} className="ct-lock-icon" />}
                  <span className="ct-step-note-text">{step.note}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="ct-builder-footer">
            <span className="ct-step-count">
              <CheckCircle2 size={14} className="ct-check-icon" />
              6 of 6 steps configured
            </span>
            <button className="ct-btn-save-seq">Save Sequence</button>
          </div>
        </div>

        {/* Right – Preview / Ready to Issue card */}
        <div className="ct-preview-card">
          <p className="ct-preview-ready">READY TO ISSUE</p>
          <h3 className="ct-preview-title">{title}</h3>
          <p className="ct-preview-sub">AY {academicYear} · {semester}</p>

          <div className="ct-preview-divider" />

          <div className="ct-preview-info-list">
            <div className="ct-preview-info-row">
              <span className="ct-preview-info-label">Approval chain</span>
              <span className="ct-preview-info-value">6 sequential steps</span>
            </div>
            <div className="ct-preview-info-row">
              <span className="ct-preview-info-label">Target year levels</span>
              <span className="ct-preview-info-value">
                {checkedYears.length === 4 ? "1st to 4th Year" : checkedYears.join(", ") || "None"}
              </span>
            </div>
            <div className="ct-preview-info-row">
              <span className="ct-preview-info-label">Template status</span>
              <span className="ct-preview-info-value">Draft</span>
            </div>
          </div>

          <div className="ct-preview-eligible-row">
            <span className="ct-preview-eligible-num">1,240</span>
            <span className="ct-preview-eligible-label">eligible students</span>
          </div>

          {/* Year bars – 2×2 grid */}
          <div className="ct-preview-bars-grid">
            {YEAR_BREAKDOWN.map((yr) => (
              <div key={yr.label} className="ct-preview-bar-item">
                <div className="ct-preview-bar-top">
                  <span className="ct-preview-bar-label">{yr.label}</span>
                  <span className="ct-preview-bar-count">{yr.count}</span>
                </div>
                <div className="ct-preview-bar-track">
                  <div
                    className="ct-preview-bar-fill"
                    style={{ width: `${(yr.count / 340) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button className="ct-preview-issue-btn">
            <Send size={14} />
            Issue Clearance to Students
          </button>

          <p className="ct-preview-note">
            One clearance record is created for every eligible student, and each student is notified automatically.
          </p>
        </div>

      </div>
    </div>
  );
}
