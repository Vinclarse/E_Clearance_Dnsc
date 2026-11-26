import { useState } from "react";
import { isImageProof } from "./signatoryApi.js";

export default function ProofPreview({
  student,
  loading,
  error,
  failed,
  onImageError,
  onClose,
  onApprove,
  onReject,
  approveDisabled,
  submitting = false,
}) {
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  if (!student) return null;

  const showImage = Boolean(student.proofUrl) && isImageProof(student.proofUrl) && !failed;
  const canReject = Boolean(onReject) && student.status !== "Cleared" && (student.proof || student.status === "Under Review");

  const handleClose = () => {
    setRejecting(false);
    setRejectReason("");
    setRejectError("");
    onClose?.();
  };

  const handleConfirmReject = async (event) => {
    event.preventDefault();
    const trimmed = rejectReason.trim();
    if (!trimmed) {
      setRejectError("Please provide a reason for rejecting this proof.");
      return;
    }
    setRejectError("");
    const ok = await onReject?.(trimmed);
    if (ok !== false) {
      setRejecting(false);
      setRejectReason("");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
      }}
      onClick={handleClose}
    >
      <div
        className="signatory-modal"
        onClick={(event) => event.stopPropagation()}
        style={{ backgroundColor: "#FFF", borderRadius: "20px", padding: "1.5rem", width: "min(500px, calc(100vw - 2rem))", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
      >
        <h3 style={{ margin: "0 0 0.35rem 0", color: "#29352A" }}>Settlement & Requirement Review</h3>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#74806E" }}>
          {student.name} ({student.studentNumber || "No student ID"}){student.req ? ` · ${student.req}` : ""}
        </p>

        <div style={{ backgroundColor: "#F6F8F4", padding: "1rem", borderRadius: "12px", margin: "1rem 0", fontSize: "0.82rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <div><strong>Program:</strong> {student.program || "—"}</div>
          <div><strong>Status:</strong> {student.status}</div>
          <div><strong>Amount Due:</strong> {student.fee}</div>
          {student.note && <div><strong>Deficiency Remarks:</strong> {student.note}</div>}
          <div><strong>Student Proof Notes:</strong> {student.proofNotes || (!student.note && student.proofDetails) || "None"}</div>
          {loading && <div style={{ color: "#3E7E9C", fontWeight: 600, marginTop: "0.4rem" }}>Loading proof attachment…</div>}
          {error && <div style={{ color: "#AA5757", fontWeight: 600, marginTop: "0.4rem" }}>{error}</div>}
          {showImage && (
            <a href={student.proofUrl} target="_blank" rel="noreferrer">
              <img
                src={student.proofUrl}
                alt={`Proof for ${student.name}`}
                onError={onImageError}
                style={{ display: "block", width: "100%", maxHeight: 280, objectFit: "contain", marginTop: "0.6rem", borderRadius: 12, background: "#fff", border: "1px solid #E2E7DC" }}
              />
            </a>
          )}
          {student.proofUrl && !showImage && (
            <a href={student.proofUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: "0.6rem", fontWeight: 700, color: "#2E3D28" }}>
              Open attached proof document ↗
            </a>
          )}
          {!loading && !student.proofUrl && (
            <div style={{ color: "#74806E", marginTop: "0.3rem" }}>No receipt or document attached.</div>
          )}
        </div>

        {rejecting ? (
          <form onSubmit={handleConfirmReject} style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginTop: "0.75rem" }}>
            <label htmlFor="reject-proof-reason" style={{ fontSize: "0.75rem", fontWeight: 700, color: "#AA5757" }}>
              REASON FOR REJECTING PROOF (REQUIRED)
            </label>
            <textarea
              id="reject-proof-reason"
              rows={3}
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="e.g., Receipt image is unreadable or reference number does not match cashier records."
              style={{ width: "100%", padding: "0.65rem 0.75rem", borderRadius: "10px", border: "1px solid #D9B4B4", fontSize: "0.82rem", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }}
            />
            {rejectError && <div role="alert" style={{ color: "#AA5757", fontSize: "0.76rem", fontWeight: 600 }}>{rejectError}</div>}
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setRejecting(false);
                  setRejectError("");
                }}
                style={{ border: "none", backgroundColor: "#EDF1E8", color: "#29352A", padding: "0.5rem 1rem", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{ border: "none", backgroundColor: "#AA5757", color: "#FFF", padding: "0.5rem 1rem", borderRadius: "8px", fontWeight: 700, cursor: submitting ? "wait" : "pointer" }}
              >
                {submitting ? "Rejecting…" : "Confirm Reject Proof"}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button type="button" onClick={handleClose} style={{ border: "none", backgroundColor: "#EDF1E8", color: "#29352A", padding: "0.5rem 1rem", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>
              Close
            </button>
            {canReject && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => setRejecting(true)}
                style={{
                  border: "1px solid #AA5757",
                  backgroundColor: "#FFF",
                  color: "#AA5757",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  fontWeight: 700,
                  cursor: submitting ? "wait" : "pointer",
                }}
              >
                Reject Proof
              </button>
            )}
            {onApprove && (
              <button
                type="button"
                disabled={approveDisabled || submitting}
                onClick={onApprove}
                title={student.isActionable === false && student.blockingOffice ? `Waiting for ${student.blockingOffice}` : undefined}
                style={{
                  border: "none",
                  backgroundColor: approveDisabled ? "#E2E7DC" : "#2E3D28",
                  color: approveDisabled ? "#74806E" : "#FFF",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  fontWeight: 700,
                  cursor: approveDisabled || submitting ? "not-allowed" : "pointer",
                }}
              >
                {student.status === "Cleared"
                  ? "Already Cleared"
                  : student.isActionable === false
                    ? "Locked by Earlier Step"
                    : submitting
                      ? "Saving…"
                      : "Approve Sign-Off"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
