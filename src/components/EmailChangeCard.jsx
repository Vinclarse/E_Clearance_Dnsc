import { useEffect, useState } from "react";
import { Mail, RefreshCw, Send, XCircle } from "lucide-react";
import {
  cancelEmailChange,
  getEmailChangeStatus,
  requestEmailChange,
  resendEmailChangeLink,
  setNewEmailAddress,
  verifyEmailChangeCode,
} from "../services/emailChange.js";

function extractError(error, fallback) {
  const data = error?.response?.data;
  const inner = data?.data ?? data;
  const errors = inner?.errors ?? data?.errors;
  const fieldError = Object.values(errors ?? {})
    .flat()
    .find((val) => typeof val === "string" && val.trim());
  const msg =
    inner?.detail ??
    errors?.detail ??
    fieldError ??
    inner?.error ??
    (data?.message !== "Error" ? data?.message : undefined);
  if (typeof msg === "string" && msg.trim()) return msg;
  return error?.message && error.message !== "Error" ? error.message : fallback;
}

export default function EmailChangeCard({ currentEmail = "", onEmailUpdated }) {
  const [flow, setFlow] = useState(null);
  const [changeToken, setChangeToken] = useState("");
  const [code, setCode] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getEmailChangeStatus()
      .then((status) => {
        if (active && status) setFlow(status);
      })
      .catch(() => {
        // Silent if status endpoint returns empty or unavailable on initial load.
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleRequestCode() {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await requestEmailChange();
      setFlow({
        stage: "code_sent",
        current_email: result?.sent_to || currentEmail,
        new_email: "",
      });
      setChangeToken("");
      setCode("");
      setNewEmail("");
      setNotice(result?.detail || `Verification code sent to ${result?.sent_to || currentEmail}.`);
    } catch (err) {
      setError(extractError(err, "Could not start email change request."));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyCode(event) {
    event.preventDefault();
    if (busy) return;
    if (!code.trim()) {
      setError("Enter the verification code sent to your current email.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await verifyEmailChangeCode(code);
      setChangeToken(result?.change_token || "");
      setFlow((prev) => ({ ...(prev || {}), stage: "code_verified" }));
      setNotice("Code verified. Enter your new email address below.");
    } catch (err) {
      setError(extractError(err, "Invalid or expired verification code."));
    } finally {
      setBusy(false);
    }
  }

  async function handleSetNewEmail(event) {
    event.preventDefault();
    if (busy) return;
    if (!newEmail.trim()) {
      setError("Enter your new email address.");
      return;
    }
    if (!changeToken) {
      setError("Your verification session expired. Please request a fresh code.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await setNewEmailAddress(changeToken, newEmail);
      setFlow((prev) => ({
        ...(prev || {}),
        stage: "awaiting_confirmation",
        new_email: result?.new_email || newEmail.trim(),
      }));
      setChangeToken("");
      setNotice(result?.detail || `Confirmation link sent to ${result?.new_email || newEmail.trim()}.`);
    } catch (err) {
      setError(extractError(err, "Could not submit the new email address."));
    } finally {
      setBusy(false);
    }
  }

  async function handleResendConfirmation() {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await resendEmailChangeLink();
      setNotice(result?.detail || `A fresh confirmation link was sent to ${result?.new_email || flow?.new_email}.`);
    } catch (err) {
      setError(extractError(err, "Could not resend confirmation link."));
    } finally {
      setBusy(false);
    }
  }

  async function handleCheckConfirmation() {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const status = await getEmailChangeStatus();
      if (!status) {
        setFlow(null);
        await onEmailUpdated?.();
        setNotice("Email status refreshed.");
      } else {
        setFlow(status);
        setNotice(`Still awaiting confirmation at ${status.new_email}.`);
      }
    } catch (err) {
      setError(extractError(err, "Could not check email change status."));
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await cancelEmailChange();
      setFlow(null);
      setChangeToken("");
      setCode("");
      setNewEmail("");
      setNotice("Email change request cancelled.");
    } catch (err) {
      setError(extractError(err, "Could not cancel email change request."));
    } finally {
      setBusy(false);
    }
  }

  const stage = flow?.stage;

  return (
    <div className="profile-info-card">
      <div className="profile-card-header">
        <Mail size={16} className="profile-card-icon" />
        <h2 className="profile-card-title">Change Email Address</h2>
      </div>

      {!stage && (
        <div>
          <p style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Current email: <strong>{currentEmail || "No email on file"}</strong>. Changing your email verifies ownership of your current address first, then sends a confirmation link to your new address.
          </p>
          {notice && <p className="profile-save-success" style={{ display: "block", marginBottom: 10 }}>{notice}</p>}
          {error && <p className="profile-pw-error" role="alert" style={{ marginBottom: 10 }}>{error}</p>}
          <div className="profile-form-actions">
            <button
              type="button"
              className="profile-save-btn"
              disabled={busy || !currentEmail}
              onClick={handleRequestCode}
            >
              <Mail size={14} />
              {busy ? "Sending code…" : "Send Verification Code"}
            </button>
          </div>
        </div>
      )}

      {stage === "code_sent" && (
        <form onSubmit={handleVerifyCode}>
          <p style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Enter the verification code sent to <strong>{flow?.current_email || currentEmail}</strong>.
          </p>
          <div className="profile-form-row single">
            <div className="profile-form-field">
              <label htmlFor="email-change-code">Verification Code</label>
              <input
                id="email-change-code"
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Enter code from inbox"
                className="profile-input"
              />
            </div>
          </div>
          {notice && <p className="profile-save-success" style={{ display: "block", marginBottom: 10 }}>{notice}</p>}
          {error && <p className="profile-pw-error" role="alert" style={{ marginBottom: 10 }}>{error}</p>}
          <div className="profile-form-actions" style={{ flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={busy}
              style={{ border: "1px solid var(--border-color)", background: "#fff", color: "var(--text-secondary)", borderRadius: 9, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <XCircle size={14} />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRequestCode}
              disabled={busy}
              style={{ border: "1px solid var(--border-color)", background: "#fff", color: "var(--text-primary)", borderRadius: 9, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
            >
              Resend Code
            </button>
            <button type="submit" className="profile-save-btn" disabled={busy}>
              {busy ? "Verifying…" : "Verify Code"}
            </button>
          </div>
        </form>
      )}

      {stage === "code_verified" && (
        changeToken ? (
          <form onSubmit={handleSetNewEmail}>
            <p style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Enter the new email address for your account. A confirmation link will be emailed to finalize the update.
            </p>
            <div className="profile-form-row single">
              <div className="profile-form-field">
                <label htmlFor="email-change-new-email">New Email Address</label>
                <input
                  id="email-change-new-email"
                  type="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  placeholder="name@dnsc.edu.ph"
                  className="profile-input"
                  required
                />
              </div>
            </div>
            {notice && <p className="profile-save-success" style={{ display: "block", marginBottom: 10 }}>{notice}</p>}
            {error && <p className="profile-pw-error" role="alert" style={{ marginBottom: 10 }}>{error}</p>}
            <div className="profile-form-actions" style={{ flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleCancel}
                disabled={busy}
                style={{ border: "1px solid var(--border-color)", background: "#fff", color: "var(--text-secondary)", borderRadius: 9, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button type="submit" className="profile-save-btn" disabled={busy}>
                <Send size={14} />
                {busy ? "Sending link…" : "Send Confirmation Link"}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Your verification session was interrupted after reload. Request a fresh verification code to continue changing your email.
            </p>
            {error && <p className="profile-pw-error" role="alert" style={{ marginBottom: 10 }}>{error}</p>}
            <div className="profile-form-actions" style={{ flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleCancel}
                disabled={busy}
                style={{ border: "1px solid var(--border-color)", background: "#fff", color: "var(--text-secondary)", borderRadius: 9, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button type="button" className="profile-save-btn" disabled={busy} onClick={handleRequestCode}>
                Request Fresh Code
              </button>
            </div>
          </div>
        )
      )}

      {stage === "awaiting_confirmation" && (
        <div>
          <p style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            A confirmation link was sent to <strong>{flow?.new_email || newEmail}</strong>. Open the link in your new inbox to complete the change.
          </p>
          {notice && <p className="profile-save-success" style={{ display: "block", marginBottom: 10 }}>{notice}</p>}
          {error && <p className="profile-pw-error" role="alert" style={{ marginBottom: 10 }}>{error}</p>}
          <div className="profile-form-actions" style={{ flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={busy}
              style={{ border: "1px solid var(--border-color)", background: "#fff", color: "var(--text-secondary)", borderRadius: 9, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={busy}
              style={{ border: "1px solid var(--border-color)", background: "#fff", color: "var(--text-primary)", borderRadius: 9, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
            >
              Resend Link
            </button>
            <button type="button" className="profile-save-btn" disabled={busy} onClick={handleCheckConfirmation}>
              <RefreshCw size={14} />
              Refresh Status
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
