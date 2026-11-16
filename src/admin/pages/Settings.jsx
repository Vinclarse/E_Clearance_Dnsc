import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import apiClient from "../../services/api.js";
import {
  apiErrorMessage,
  bulkUpdateSettings,
  fetchFeatureToggles,
  fetchSystemSettings,
} from "../services/portalApi.js";
import PortalLoading from "../../components/PortalLoading.jsx";
import "./Settings.css";

function isFlag(value) {
  return ["true", "false", "1", "0", "yes", "no"].includes(String(value).trim().toLowerCase());
}

function flagOn(value) {
  return ["true", "1", "yes"].includes(String(value).trim().toLowerCase());
}

function titleFor(key) {
  return String(key || "Setting")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function Settings() {
  const [settings, setSettings] = useState([]);
  const [features, setFeatures] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([fetchSystemSettings(), fetchFeatureToggles()])
      .then(([rows, featureRows]) => {
        if (!active) return;
        setSettings(rows);
        setFeatures(featureRows);
        setActiveTab(rows[0]?.bucket || (featureRows.length ? "features" : ""));
      })
      .catch((loadError) => {
        if (active) setError(apiErrorMessage(loadError, "Could not load system settings."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const buckets = useMemo(() => {
    const names = [];
    settings.forEach((row) => {
      const bucket = row.bucket || "general";
      if (!names.includes(bucket)) names.push(bucket);
    });
    if (features.length) names.push("features");
    return names;
  }, [settings, features]);

  const visibleSettings = settings.filter((row) => (row.bucket || "general") === activeTab);

  function valueFor(row) {
    return drafts[row.setting_key] ?? row.setting_value ?? "";
  }

  function featureValue(feature) {
    const key = feature.key || feature.feature;
    if (key in drafts) return flagOn(drafts[key]);
    return Boolean(feature.enabled);
  }

  async function handleSave() {
    setMessage("");
    setError("");
    if (Object.keys(drafts).length === 0) {
      setMessage("No changes to save.");
      return;
    }
    setSaving(true);
    try {
      await bulkUpdateSettings(drafts);
      setSettings((current) => current.map((row) => (
        row.setting_key in drafts ? { ...row, setting_value: drafts[row.setting_key] } : row
      )));
      setFeatures((current) => current.map((feature) => {
        const key = feature.key || feature.feature;
        return key in drafts ? { ...feature, enabled: flagOn(drafts[key]) } : feature;
      }));
      setDrafts({});
      setMessage("Settings saved.");
    } catch (saveError) {
      setError(apiErrorMessage(saveError, "Could not save these settings."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PortalLoading
        title="Loading settings"
        detail="Getting the institute settings and the features this account can change."
      />
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-sub">Institute settings from the E-Clearance API. Only rows you are allowed to change can be edited.</p>
      </div>

      {error && <p className="settings-error" role="alert">{error}</p>}

      {buckets.length === 0 && !error && (
        <p>No system settings are available for this account.</p>
      )}

      {buckets.length > 0 && (
        <div className="settings-layout">
          <nav className="settings-nav" aria-label="Setting sections">
            {buckets.map((bucket) => (
              <button
                key={bucket}
                type="button"
                className={"settings-nav-item" + (activeTab === bucket ? " active" : "")}
                onClick={() => setActiveTab(bucket)}
              >
                <span>{titleFor(bucket)}</span>
              </button>
            ))}
          </nav>

          <div className="settings-panel">
            {activeTab === "features" ? (
              <div className="settings-section">
                <h2 className="settings-section-title">Optional modules</h2>
                <p className="settings-section-sub">Modules the API reports for this institute.</p>
                <div className="settings-toggle-list">
                  {features.map((feature) => {
                    const key = feature.key || feature.feature;
                    const enabled = featureValue(feature);
                    return (
                      <div key={key} className="settings-toggle-row">
                        <div className="settings-toggle-info">
                          <p className="settings-toggle-label">{titleFor(feature.feature || key)}</p>
                          <p className="settings-toggle-desc">
                            {feature.available ? "Available for this institute." : "Not available for this institute."}
                            {feature.requires ? ` Requires ${feature.requires}.` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          className={"settings-toggle" + (enabled ? " on" : "")}
                          disabled={!feature.available}
                          aria-pressed={enabled}
                          onClick={() => setDrafts((current) => ({ ...current, [key]: enabled ? "false" : "true" }))}
                        >
                          <span className="settings-toggle-thumb" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="settings-section">
                <h2 className="settings-section-title">{titleFor(activeTab)}</h2>
                <div className="settings-toggle-list">
                  {visibleSettings.map((row) => {
                    const current = valueFor(row);
                    return (
                      <div key={row.id || row.setting_key} className="settings-toggle-row">
                        <div className="settings-toggle-info">
                          <p className="settings-toggle-label">{titleFor(row.setting_key)}</p>
                          <p className="settings-toggle-desc">{row.description || row.setting_key}</p>
                          {isFlag(row.setting_value) ? null : (
                            <input
                              className="settings-input"
                              value={current}
                              disabled={row.can_change === false}
                              onChange={(event) => setDrafts((draft) => ({
                                ...draft,
                                [row.setting_key]: event.target.value,
                              }))}
                            />
                          )}
                        </div>
                        {isFlag(row.setting_value) && (
                          <button
                            type="button"
                            className={"settings-toggle" + (flagOn(current) ? " on" : "")}
                            disabled={row.can_change === false}
                            aria-pressed={flagOn(current)}
                            onClick={() => setDrafts((draft) => ({
                              ...draft,
                              [row.setting_key]: flagOn(current) ? "false" : "true",
                            }))}
                          >
                            <span className="settings-toggle-thumb" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="settings-actions">
              {message && <span className="settings-saved-msg">{message}</span>}
              <button type="button" className="settings-save-btn" onClick={handleSave} disabled={saving}>
                <Save size={14} /> {saving ? "Saving…" : "Save changes"}
              </button>
            </div>

            <div className="settings-system-grid">
              <div className="settings-system-row">
                <span className="settings-system-label">API</span>
                <span className="settings-system-value">{apiClient.defaults.baseURL}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
