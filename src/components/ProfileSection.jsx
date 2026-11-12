import { useState, useEffect } from "react";
import apiClient from "../services/api";

function getProfileUpdateErrorMessage(error) {
  const responseData = error.response?.data;
  const errorData = responseData?.data ?? responseData;
  const errors = errorData?.errors ?? responseData?.errors;
  const fieldError = Object.values(errors ?? {})
    .flat()
    .find((value) => typeof value === "string");
  const message =
    errorData?.detail ??
    errors?.detail ??
    fieldError ??
    errorData?.error ??
    (responseData?.message !== "Error" ? responseData?.message : undefined);

  if (typeof message === "string") return message;
  return error.message || "Could not update your profile image.";
}

function ProfileSection({ onAvatarUpdated, requirements = [] }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    apiClient.get("me/")
      .then((res) => {
        const data = res.data?.data ?? res.data;
        const currentProfile = Array.isArray(data) ? data[0] ?? null : data;
        setProfile(currentProfile);
        setAvatarPreview(currentProfile?.profile_url ?? currentProfile?.profile ?? null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to sync profile:", err);
        setLoading(false);
      });
  }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setPendingAvatarFile(file);
    setPendingPreviewUrl(previewUrl);
    setShowModal(true);
    
    e.target.value = "";
  };

  const handleConfirmUpload = async () => {
    if (!pendingAvatarFile) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const profileData = new FormData();
      profileData.append("profile", pendingAvatarFile);
      const profileResponse = await apiClient.patch("me/update/", profileData);
      const updatedProfile = profileResponse.data?.data ?? profileResponse.data;
      const profileUrl = updatedProfile?.profile_url ?? updatedProfile?.profile;
      if (typeof profileUrl !== "string" || !profileUrl) {
        throw new Error("The profile update response did not include a profile image URL.");
      }

      setProfile((currentProfile) => ({ ...currentProfile, ...updatedProfile }));
      setAvatarPreview(profileUrl);
      onAvatarUpdated?.(profileUrl);
      setPendingAvatarFile(null);
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
      setPendingPreviewUrl(null);
      setShowModal(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } catch (error) {
      console.error("Failed to update profile image:", error);
      setUploadError(getProfileUpdateErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelUpload = () => {
    setPendingAvatarFile(null);
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingPreviewUrl(null);
    setUploadError("");
    setShowModal(false);
  };

  if (loading) {
    return <div className="tracker-blueprint-alert">Retrieving institutional profile rows...</div>;
  }

  const initials = profile?.first_name && profile?.last_name
    ? `${profile.first_name.charAt(0).toUpperCase()}${profile.last_name.charAt(0).toUpperCase()}`
    : profile?.name 
      ? profile.name.charAt(0).toUpperCase()
      : "A";

  const displayName = profile?.first_name || profile?.last_name
    ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
    : profile?.username || "Student";
  const student = profile?.student ?? {};
  const profileImage = avatarPreview || profile?.profile_url || profile?.profile;
  const programRecord = student.program;
  const academicProgram = student.program_name
    ?? (typeof programRecord === "string" ? programRecord : programRecord?.name)
    ?? student.course
    ?? "—";
  const studentNumber = student.s_studentID || student.student_number || student.student_id || "—";
  const organization = profile?.institute?.institute_name
    || profile?.institute?.name
    || profile?.school?.school_name
    || profile?.school?.name
    || "—";

  return (
    <div className="profile-grid-layout" style={{ position: "relative" }}>
      {/* Sliding system alert alert notification modal panel */}
      <div className={`profile-system-toast-alert-modal ${showToast ? "slide-in" : ""}`}>
        <div className="toast-alert-icon-check">✓</div>
        <div className="toast-alert-text-block">
          <h5>Photo Updated Successfully</h5>
          <p>Your official institutional student portal profile picture has been re-saved.</p>
        </div>
      </div>

      <div className="profile-left-card">
        <div className="profile-avatar-container-interactive">
          <label htmlFor="avatar-file-input-selector" className="avatar-uploader-click-wrapper">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="avatar-image-render-circle-fixed" />
            ) : (
              <div className="profile-avatar-circle">{initials}</div>
            )}
            <div className="avatar-mini-upload-badge">
              <svg 
                xmlns="http://w3.org" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#3a3c30" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                style={{ width: "14px", height: "14px" }}
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
          </label>
          <input 
            type="file" 
            id="avatar-file-input-selector" 
            className="hidden-file-input-completely" 
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleImageSelect}
          />
        </div>
        
        <h3 className="profile-name">{displayName}</h3>
        <p className="profile-id-number">{studentNumber}</p>
        <span className="profile-status-badge">{profile?.groups?.join(", ") || "STUDENT"}</span>
      </div>

      <div className="profile-right-container">
        <div className="profile-inner-capsule">
          <h3 className="capsule-title">Account Details</h3>
          <div className="info-item-block">
            <span className="info-label">Email Address</span>
            <span className="info-value">{profile?.email || "—"}</span>
          </div>
          <div className="info-item-block">
            <span className="info-label">Login Username</span>
            <span className="info-value">{profile?.username || "—"}</span>
          </div>
          <div className="info-item-block">
            <span className="info-label">System Role Group</span>
            <span className="info-value">{profile?.groups?.join(", ") || "Students"}</span>
          </div>
        </div>

        <div className="profile-inner-capsule">
          <h3 className="capsule-title">Institutional Scope</h3>
          <div className="info-item-block">
            <span className="info-label">Academic Program</span>
            <span className="info-value">{typeof academicProgram === "string" ? academicProgram : "—"}</span>
          </div>
          <div className="info-item-block">
            <span className="info-label">Organizational Scope</span>
            <span className="info-value">{organization}</span>
          </div>
          <div className="info-item-block">
            <span className="info-label">Assigned Requirements</span>
            <span className="info-value">{requirements.length} Requirements</span>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="profile-avatar-modal-overlay">
          <div className="profile-avatar-modal-card-box">
            <h4>Confirm Profile Picture</h4>
            <p>Would you like to set this image as your official institutional profile picture?</p>
            
            <div className="profile-avatar-modal-preview-zone">
              <img src={pendingPreviewUrl} alt="Pending Preview" className="profile-avatar-modal-image-element" />
            </div>

            <div className="profile-avatar-modal-actions-row">
              {uploadError && <p className="login-message" role="alert">{uploadError}</p>}
              <button type="button" className="submit-request-form-btn-cancel" onClick={handleCancelUpload} disabled={isUploading}>
                Cancel
              </button>
              <button type="button" className="submit-request-form-btn-aligned" onClick={handleConfirmUpload} disabled={isUploading}>
                {isUploading ? "Saving..." : "Confirm Picture"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileSection;
