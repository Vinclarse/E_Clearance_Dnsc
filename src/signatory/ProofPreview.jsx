import { isImageProof } from "./signatoryApi.js";

export default function ProofPreview({
  student,
  loading,
  error,
  failed,
  onImageError,
  onClose,
  onApprove,
  approveDisabled,
}) {
  if (!student) return null;
  const showImage = Boolean(student.proofUrl) && isImageProof(student.proofUrl) && !failed;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.4)",
      display: "grid",
      placeItems: "center",
      zIndex: 1000,
    }}>
      <div className="signatory-modal" style={{ backgroundColor: "#FFF", borderRadius: "20px", padding: "1.5rem", width: "min(480px, calc(100vw - 2rem))", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
        <h3 style={{ margin: "0 0 0.5rem 0" }}>Student Requirement Details</h3>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#74806E" }}>
          {student.name} ({student.studentNumber || "No student ID"})
        </p>
        <div style={{ backgroundColor: "#F6F8F4", padding: "1rem", borderRadius: "12px", margin: "1rem 0", fontSize: "0.82rem" }}>
          <div><strong>Program:</strong> {student.program || "—"}</div>
          <div><strong>Status:</strong> {student.status}</div>
          <div><strong>Notes:</strong> {student.proofDetails || "None"}</div>
          <div><strong>Amount Due:</strong> {student.fee}</div>
          {loading && <div>Loading proof…</div>}
          {error && <div>{error}</div>}
          {showImage && (
            <a href={student.proofUrl} target="_blank" rel="noreferrer">
              <img
                src={student.proofUrl}
                alt={`Proof for ${student.name}`}
                onError={onImageError}
                style={{ display: "block", width: "100%", maxHeight: 280, objectFit: "contain", marginTop: "0.8rem", borderRadius: 12, background: "#fff" }}
              />
            </a>
          )}
          {student.proofUrl && !showImage && (
            <a href={student.proofUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: "0.8rem", fontWeight: 700 }}>
              Open proof
            </a>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={{ border: "none", backgroundColor: "#EDF1E8", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer" }}>
            Close
          </button>
          {onApprove && (
            <button
              type="button"
              disabled={approveDisabled}
              onClick={onApprove}
              style={{
                border: "none",
                backgroundColor: approveDisabled ? "#E2E7DC" : "#2E3D28",
                color: approveDisabled ? "#74806E" : "#FFF",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                cursor: approveDisabled ? "not-allowed" : "pointer",
              }}
            >
              {student.status === "Cleared" ? "Already Cleared" : "Approve Sign-Off"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
