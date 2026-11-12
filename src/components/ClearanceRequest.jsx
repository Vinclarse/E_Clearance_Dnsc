import { useState } from "react";
import apiClient from "../services/api";

function ClearanceRequest({
  requirements,
  onUploadSuccess,
  onUploadTriggered,
  onUploadCompleted,
  requestItemId,
  onRequestItemHandled,
}) {
  const [selectedItemId, setSelectedItemId] = useState("");
  const [fileAttachment, setFileAttachment] = useState(null);
  const [notesText, setNotesText] = useState("");
  const [uploadStatus, setUploadStatus] = useState("AWAITING SELECTION");
  const [showReSubmitModal, setShowReSubmitModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // NEW: success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successOfficeName, setSuccessOfficeName] = useState("");
  const activeSelectedItemId = requestItemId ?? selectedItemId;

  const handleOfficeDropdownChange = (e) => {
    const itemId = e.target.value;
    if (!itemId) {
      setSelectedItemId("");
      onRequestItemHandled?.();
      return;
    }

    const targetItem = requirements.find(item => item.id === parseInt(itemId));
    const isCleared = targetItem?.status && targetItem.status.toLowerCase() === "cleared";

    if (isCleared || targetItem?.is_actionable === false) {
      setSelectedItemId("");
      setUploadStatus("AWAITING SELECTION");
    } else {
      setSelectedItemId(itemId);
    }
    onRequestItemHandled?.();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setFileAttachment(null);
        setUploadStatus("FILE EXCEEDS 5MB LIMIT");
        e.target.value = "";
        return;
      }

      setFileAttachment(file);
      setUploadStatus("READY TO SUBMIT");
    }
  };

  const resetForm = () => {
    setFileAttachment(null);
    setNotesText("");
    setSelectedItemId("");
    onRequestItemHandled?.();
    setUploadStatus("AWAITING SELECTION");
    setShowReSubmitModal(false);
  };

  const handlePreSubmitCheck = (e) => {
    e.preventDefault();
    if (!activeSelectedItemId || !fileAttachment || isUploading) return;

    const selectedOffice = requirements.find(item => item.id === parseInt(activeSelectedItemId));
    if (!selectedOffice || selectedOffice.is_actionable === false) {
      setUploadStatus("SELECT AN ACTIONABLE REQUIREMENT");
      return;
    }
    const currentStatus = selectedOffice?.status ? selectedOffice.status.toLowerCase() : "";

    if (currentStatus === "deficiency" || currentStatus === "under_review") {
      setShowReSubmitModal(true);
    } else {
      executeFormUpload();
    }
  };

  // NEW: shared success handler (used by both .then and .catch below)
  const handleUploadComplete = (officeName, updatedItem) => {
    setUploadStatus("UPLOAD SUCCESSFUL");
    if (onUploadTriggered) onUploadTriggered(officeName);
    if (onUploadSuccess && typeof updatedItem?.status === "string") {
      onUploadSuccess(activeSelectedItemId, updatedItem.status);
    }
    onUploadCompleted?.();
    setSuccessOfficeName(officeName);
    resetForm();
    setUploadStatus("UPLOAD SUCCESSFUL");
    setShowSuccessModal(true);
  };

  const executeFormUpload = () => {
    if (isUploading || !activeSelectedItemId || !fileAttachment) return;
    setIsUploading(true);
    setUploadStatus("UPLOADING FILE...");
    setShowReSubmitModal(false);

    const selectedOffice = requirements.find(item => item.id === parseInt(activeSelectedItemId));
    const officeName = selectedOffice ? selectedOffice.requirement_name : "Target Office";

    const formData = new FormData();
    formData.append("proof_attachment", fileAttachment);
    if (notesText) {
      formData.append("proof_notes", notesText);
    }

    apiClient.post(`student-clearance-items/${activeSelectedItemId}/upload-proof/`, formData)
    .then((response) => {
      const updatedItem = response.data?.data ?? response.data;
      handleUploadComplete(officeName, updatedItem);
    })
    .catch((error) => {
      console.error("Failed to upload clearance proof:", error);
      const detail = error.response?.data?.detail;
      setUploadStatus(typeof detail === "string" ? detail : "UPLOAD FAILED. PLEASE TRY AGAIN.");
    })
    .finally(() => {
      setIsUploading(false);
    });
  };

  const deficiencyCount = requirements.filter(item => item.status && item.status.toLowerCase() === "deficiency").length;
  const pendingCount = requirements.filter(item => item.status && item.status.toLowerCase() === "pending").length;
  const clearedCount = requirements.filter(item => item.status && item.status.toLowerCase() === "cleared").length;

  return (
    <div className="profile-grid-layout">
      <div className="profile-left-card">
        <div className="request-sidebar-inner">
          <div className="request-illustration-box">📁</div>
          <h3 className="profile-name">Submit Request</h3>
          <p className="profile-id-number">Upload your institutional supporting clearance requirements below</p>
        </div>
      </div>

      <div className="request-right-master-white-card">
        <div className="request-top-capsule-row-nested">
          <div className="request-mini-pill">
            <span className="pill-stat-label">Total Cleared</span>
            <span className="pill-stat-val">{clearedCount} Steps</span>
          </div>
          <div className="request-mini-pill">
            <span className="pill-stat-label">Pending Sign-off</span>
            <span className="pill-stat-val">{pendingCount} Steps</span>
          </div>
          <div className="request-mini-pill">
            <span className="pill-stat-label">Active Deficiencies</span>
            <span className="pill-stat-val" style={{ color: deficiencyCount > 0 ? "#d84c4c" : "inherit" }}>
              {deficiencyCount} Items
            </span>
          </div>
        </div>

        <div className="request-lower-inner-grey-box">
          <div className="upload-header-zone-aligned">
            <h4 className="capsule-title-clean">Settlement Proof Submission</h4>
            <div className="request-status-action-pill-aligned">{uploadStatus}</div>
          </div>

          <hr className="panel-divider-clean-line" />

          <form onSubmit={handlePreSubmitCheck} className="request-embedded-form-aligned">
            <div className="info-item-block-aligned">
              <label className="info-label-aligned">Select Office / Target Requirement</label>
              <select
                value={activeSelectedItemId}
                onChange={handleOfficeDropdownChange}
                required
                className="request-dropdown-select-aligned"
              >
                <option value="">-- Choose an Office Requirement --</option>
                {requirements.map((item, index) => {
                  const isCleared = item.status && item.status.toLowerCase() === "cleared";
                  return (
                    <option
                      key={item.id || index}
                      value={item.id}
                      disabled={isCleared || item.is_actionable === false}
                      style={{ color: isCleared ? "#a1a396" : "gray" }}
                    >
                      Step {index + 1}: {item.requirement_name} {isCleared ? "✓ (APPROVED)" : `(${item.status.toUpperCase().replace("_", " ")})`}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="file-upload-drag-area-aligned">
              <input
                type="file"
                id="clearance-file-input"
                className="hidden-file-input-completely"
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg"
              />
              <label htmlFor="clearance-file-input" className="file-upload-label-wrapper-aligned">
                <span className="upload-cloud-icon-aligned">📤</span>
                <span className="upload-main-text-aligned">
                  {fileAttachment ? fileAttachment.name : "Drag and drop your document file here"}
                </span>
                <span className="upload-sub-text-aligned">Supports PDF, PNG, or JPG up to 5MB</span>
              </label>
            </div>

            <div className="info-item-block-aligned">
              <label className="info-label-aligned">Reference Number or Transaction Notes (Optional)</label>
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="e.g., GCash Reference Number or transaction window identifier logs"
                className="request-textarea-input-aligned"
              />
            </div>

            <div className="request-form-action-row-container">
              <button type="button" className="submit-request-form-btn-cancel" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="submit-request-form-btn-aligned" disabled={isUploading}>
                {isUploading ? "Uploading..." : "Submit Clearance File"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showReSubmitModal && (
        <div className="profile-avatar-modal-overlay">
          <div className="profile-avatar-modal-card-box">
            <h4>Confirm Document Submission</h4>
            <p>You are about to submit clearance settlement proof details for an office with an active hold or review trail. Are you sure you want to proceed with this file update?</p>

            <div className="profile-avatar-modal-actions-row">
              <button type="button" className="submit-request-form-btn-cancel" onClick={() => setShowReSubmitModal(false)}>
                Cancel
              </button>
              <button type="button" className="submit-request-form-btn-aligned" onClick={executeFormUpload} disabled={isUploading}>
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Success modal */}
      {showSuccessModal && (
        <div className="profile-avatar-modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div
            className="profile-avatar-modal-card-box success-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="success-modal-icon">✓</div>
            <h4>Successfully Uploaded</h4>
            <p>
            Your proof for <strong>{successOfficeName}</strong> was submitted successfully.
            The latest status will appear on your clearance list.
            </p>

            <div className="profile-avatar-modal-actions-row success-modal-actions">
              <button
                type="button"
                className="submit-request-form-btn-aligned"
                onClick={() => setShowSuccessModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClearanceRequest;