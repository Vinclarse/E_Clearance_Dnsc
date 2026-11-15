import { useState, useRef } from "react";
import { Camera, Save, Lock, Mail, User, Shield } from "lucide-react";
import "./Profile.css";

export default function Profile() {
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [name, setName] = useState("Jandy Kyle Fuerza");
  const [email, setEmail] = useState("admin@dnsc.edu.ph");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saved, setSaved] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");
  const fileRef = useRef(null);

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarSrc(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleSaveProfile(e) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleChangePassword(e) {
    e.preventDefault();
    setPwError("");
    if (!currentPw || !newPw || !confirmPw) {
      setPwError("Please fill in all password fields.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("New passwords do not match.");
      return;
    }
    if (newPw.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    setPwSaved(true);
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setTimeout(() => setPwSaved(false), 2500);
  }

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <h1 className="profile-page-title">My Profile</h1>
        <p className="profile-page-sub">Manage your account information and security settings.</p>
      </div>

      <div className="profile-grid">

        {/* ── Avatar Card ── */}
        <div className="profile-avatar-card">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar-circle">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Profile" className="profile-avatar-img" />
              ) : (
                <span className="profile-avatar-initials">{initials}</span>
              )}
            </div>
            <button
              className="profile-avatar-upload-btn"
              onClick={() => fileRef.current.click()}
              title="Upload photo"
            >
              <Camera size={15} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
          </div>
          <h3 className="profile-avatar-name">{name}</h3>
          <p className="profile-avatar-email">{email}</p>
          <span className="profile-avatar-role-badge">
            <Shield size={11} />
            System Administrator
          </span>
          <p className="profile-avatar-hint">
            Click the camera icon to upload a new photo. Recommended: square image, at least 200x200px.
          </p>
        </div>

        {/* ── Info Form ── */}
        <div className="profile-main-col">

          <form className="profile-info-card" onSubmit={handleSaveProfile}>
            <div className="profile-card-header">
              <User size={16} className="profile-card-icon" />
              <h2 className="profile-card-title">Personal Information</h2>
            </div>

            <div className="profile-form-row">
              <div className="profile-form-field">
                <label>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="profile-input"
                  placeholder="Enter your full name"
                />
              </div>
              <div className="profile-form-field">
                <label>Employee ID</label>
                <input
                  type="text"
                  value="ADM-2024-001"
                  readOnly
                  className="profile-input readonly"
                />
              </div>
            </div>

            <div className="profile-form-row">
              <div className="profile-form-field">
                <label>Email Address</label>
                <div className="profile-input-icon-wrap">
                  <Mail size={14} className="profile-input-icon" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="profile-input with-icon"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div className="profile-form-field">
                <label>Role</label>
                <input
                  type="text"
                  value="System Administrator"
                  readOnly
                  className="profile-input readonly"
                />
              </div>
            </div>

            <div className="profile-form-row">
              <div className="profile-form-field">
                <label>Department</label>
                <input
                  type="text"
                  defaultValue="Administration - All Institutes"
                  className="profile-input"
                />
              </div>
              <div className="profile-form-field">
                <label>Contact Number</label>
                <input
                  type="text"
                  defaultValue="+63 912 345 6789"
                  className="profile-input"
                />
              </div>
            </div>

            <div className="profile-form-actions">
              {saved && <span className="profile-save-success">Changes saved successfully!</span>}
              <button type="submit" className="profile-save-btn">
                <Save size={14} />
                Save Changes
              </button>
            </div>
          </form>

          {/* ── Password Card ── */}
          <form className="profile-info-card" onSubmit={handleChangePassword}>
            <div className="profile-card-header">
              <Lock size={16} className="profile-card-icon" />
              <h2 className="profile-card-title">Change Password</h2>
            </div>

            <div className="profile-form-row single">
              <div className="profile-form-field">
                <label>Current Password</label>
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="profile-input"
                  placeholder="Enter current password"
                />
              </div>
            </div>

            <div className="profile-form-row">
              <div className="profile-form-field">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="profile-input"
                  placeholder="Min. 8 characters"
                />
              </div>
              <div className="profile-form-field">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className="profile-input"
                  placeholder="Repeat new password"
                />
              </div>
            </div>

            {pwError && <p className="profile-pw-error">{pwError}</p>}

            <div className="profile-form-actions">
              {pwSaved && <span className="profile-save-success">Password updated successfully!</span>}
              <button type="submit" className="profile-save-btn">
                <Lock size={14} />
                Update Password
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}