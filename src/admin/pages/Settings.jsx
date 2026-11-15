import { useState } from "react";
import { Bell, Globe, Shield, Database, Save, ChevronRight } from "lucide-react";
import "./Settings.css";

const academicYears = [
  { id: 1, year: "2026-2027", active: true },
  { id: 2, year: "2025-2026", active: false },
  { id: 3, year: "2024-2025", active: false },
];

const SECURITY_ITEMS = [
  { key: "twoFactor",    label: "Two-Factor Authentication", desc: "Require 2FA for all admin logins",                      default: false },
  { key: "sessionTimeout", label: "Session Timeout",         desc: "Auto logout after 30 min of inactivity",                default: true  },
  { key: "auditTrail",   label: "Login Audit Trail",         desc: "Log all admin login attempts",                          default: true  },
  { key: "ipRestrict",   label: "IP Restriction",            desc: "Restrict admin access to whitelisted IP addresses",     default: false },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("notifications");
  const [saved,     setSaved]     = useState(false);
  const [newYear,   setNewYear]   = useState("");

  const [notifs, setNotifs] = useState({
    clearanceIssued:   true,
    studentSubmission: true,
    deficiencyFiled:   true,
    weeklyReport:      false,
    systemAlerts:      true,
  });

  const [security, setSecurity] = useState({
    twoFactor:      false,
    sessionTimeout: true,
    auditTrail:     true,
    ipRestrict:     false,
  });

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const tabs = [
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "academic",      label: "Academic Year",  icon: Globe },
    { id: "security",      label: "Security",        icon: Shield },
    { id: "system",        label: "System",          icon: Database },
  ];

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-sub">Manage system preferences, notifications, and security options.</p>
      </div>

      <div className="settings-layout">

        {/* Sidebar tabs */}
        <nav className="settings-nav">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={"settings-nav-item" + (activeTab === tab.id ? " active" : "")}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                <ChevronRight size={13} className="settings-nav-arrow" />
              </button>
            );
          })}
        </nav>

        {/* Panel */}
        <div className="settings-panel">

          {/* ── Notifications ── */}
          {activeTab === "notifications" && (
            <div className="settings-section">
              <h2 className="settings-section-title">Notification Preferences</h2>
              <p className="settings-section-sub">Choose which events trigger admin notifications.</p>
              <div className="settings-toggle-list">
                {[
                  { key: "clearanceIssued",   label: "Clearance Issued",        desc: "Notify when a clearance batch is issued to students" },
                  { key: "studentSubmission",  label: "Student Submissions",     desc: "Notify when students submit clearance requirements" },
                  { key: "deficiencyFiled",    label: "Deficiency Filed",        desc: "Notify when a deficiency is filed by an office" },
                  { key: "weeklyReport",       label: "Weekly Summary Report",   desc: "Receive a weekly digest of clearance progress" },
                  { key: "systemAlerts",       label: "System Alerts",           desc: "Critical system notifications and error alerts" },
                ].map((item) => (
                  <div key={item.key} className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <p className="settings-toggle-label">{item.label}</p>
                      <p className="settings-toggle-desc">{item.desc}</p>
                    </div>
                    <button
                      className={"settings-toggle" + (notifs[item.key] ? " on" : "")}
                      onClick={() => setNotifs((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                      aria-label={item.label}
                    >
                      <span className="settings-toggle-thumb" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="settings-actions">
                {saved && <span className="settings-saved-msg">Settings saved!</span>}
                <button className="settings-save-btn" onClick={handleSave}>
                  <Save size={14} /> Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* ── Academic Year ── */}
          {activeTab === "academic" && (
            <div className="settings-section">
              <h2 className="settings-section-title">Academic Year Management</h2>
              <p className="settings-section-sub">Set the active academic year used across all clearance workflows.</p>
              <div className="settings-academic-list">
                {academicYears.map((ay) => (
                  <div key={ay.id} className={"settings-academic-row" + (ay.active ? " active" : "")}>
                    <div className="settings-academic-info">
                      <span className="settings-academic-year">{ay.year}</span>
                      {ay.active && <span className="settings-active-badge">Active</span>}
                    </div>
                    {!ay.active && <button className="settings-set-active-btn">Set as Active</button>}
                  </div>
                ))}
              </div>
              <div className="settings-add-year">
                <h3 className="settings-add-year-title">Add New Academic Year</h3>
                <div className="settings-add-year-form">
                  <input
                    type="text"
                    className="settings-input"
                    placeholder="e.g. 2027-2028"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                  />
                  <button className="settings-save-btn">
                    <Save size={14} /> Add Year
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Security ── */}
          {activeTab === "security" && (
            <div className="settings-section">
              <h2 className="settings-section-title">Security Settings</h2>
              <p className="settings-section-sub">Manage access controls and session policies.</p>
              <div className="settings-toggle-list">
                {SECURITY_ITEMS.map((item) => (
                  <div key={item.key} className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <p className="settings-toggle-label">{item.label}</p>
                      <p className="settings-toggle-desc">{item.desc}</p>
                    </div>
                    <button
                      className={"settings-toggle" + (security[item.key] ? " on" : "")}
                      onClick={() => setSecurity((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                      aria-label={item.label}
                    >
                      <span className="settings-toggle-thumb" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="settings-actions">
                {saved && <span className="settings-saved-msg">Settings saved!</span>}
                <button className="settings-save-btn" onClick={handleSave}>
                  <Save size={14} /> Save Security Settings
                </button>
              </div>
            </div>
          )}

          {/* ── System ── */}
          {activeTab === "system" && (
            <div className="settings-section">
              <h2 className="settings-section-title">System Information</h2>
              <p className="settings-section-sub">Application details and configuration.</p>
              <div className="settings-system-grid">
                {[
                  { label: "Application",  value: "E-Clearance Admin Portal" },
                  { label: "Version",      value: "v2.0.0" },
                  { label: "Institution",  value: "Davao del Norte State College" },
                  { label: "API Endpoint", value: "http://localhost:8000/api" },
                  { label: "Environment",  value: "Development" },
                  { label: "Last Updated", value: "November 2026" },
                ].map((item) => (
                  <div key={item.label} className="settings-system-row">
                    <span className="settings-system-label">{item.label}</span>
                    <span className="settings-system-value">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="settings-danger-zone">
                <h3 className="settings-danger-title">Danger Zone</h3>
                <p className="settings-danger-desc">These actions are irreversible. Proceed with caution.</p>
                <button className="settings-danger-btn">Clear All Clearance Data for Current Term</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}