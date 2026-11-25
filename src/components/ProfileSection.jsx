import { useEffect, useRef, useState } from "react";
import { Camera, Save, Lock, Mail, User, Shield } from "lucide-react";
import apiClient from "../services/api";
import { fetchCurrentUser } from "../services/account.js";
import { publishAccount, subscribePortalRefresh } from "../services/portalRefresh.js";
import PasswordInput from "./PasswordInput.jsx";
import PortalLoading from "./PortalLoading.jsx";
import "../admin/pages/Profile.css";

function profileImage(profile) {
  const value = profile?.profile_url || profile?.profile;
  return typeof value === "string" && value.trim() ? value : null;
}

function errorMessage(error, fallback) {
  const responseData = error?.response?.data;
  const errorData = responseData?.data ?? responseData;
  const errors = errorData?.errors ?? responseData?.errors;
  const fieldError = Object.values(errors ?? {})
    .flat()
    .find((value) => typeof value === "string");
  const message =
    errorData?.detail
    ?? errors?.detail
    ?? fieldError
    ?? errorData?.error
    ?? (responseData?.message !== "Error" ? responseData?.message : undefined);
  if (typeof message === "string" && message !== "Error") return message;
  return error?.message && error.message !== "Error" ? error.message : fallback;
}

export default function ProfileSection({ onAvatarUpdated }) {
  const [profile, setProfile] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saved, setSaved] = useState("");
  const [pwSaved, setPwSaved] = useState("");
  const [error, setError] = useState("");
  const [pwError, setPwError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    let active = true;
    function loadProfile() {
      setLoading(true);
      fetchCurrentUser()
        .then((account) => {
          if (!active) return;
          setProfile(account);
          setFirstName(account?.first_name || "");
          setLastName(account?.last_name || "");
          setAvatarSrc(profileImage(account));
        })
        .catch((loadError) => {
          if (active) setError(errorMessage(loadError, "Could not load this profile."));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    loadProfile();
    const stopRefresh = subscribePortalRefresh(loadProfile);
    return () => {
      active = false;
      stopRefresh();
    };
  }, []);

  const displayName = [firstName, lastName].filter(Boolean).join(" ") || profile?.username || "Account";
  const groups = Array.isArray(profile?.groups) ? profile.groups : [];
  const roleName = groups.length
    ? String(groups[0]?.name ?? groups[0])
    : "Student";
  const student = profile?.student ?? {};
  const studentNumber = student.s_studentID || student.student_number || student.student_id || "";
  const programRecord = student.program;
  const academicProgram = student.program_name
    ?? (typeof programRecord === "string" ? programRecord : programRecord?.name)
    ?? student.course
    ?? "";
  const instituteName = profile?.institute?.institute_name || profile?.institute?.name || "—";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "A";

  function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    setError("");
    setAvatarFile(file);
    setAvatarSrc(URL.createObjectURL(file));
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    setError("");
    setSaved("");
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("first_name", firstName.trim());
      payload.append("last_name", lastName.trim());
      if (avatarFile) payload.append("profile", avatarFile);
      await apiClient.patch("me/update/", payload);
      const account = await fetchCurrentUser({ fresh: true });
      const next = { ...account, first_name: firstName.trim(), last_name: lastName.trim() };
      setProfile(next);
      setAvatarFile(null);
      const nextImage = profileImage(next) || avatarSrc;
      setAvatarSrc(nextImage);
      publishAccount(next);
      if (nextImage) onAvatarUpdated?.(nextImage);
      setSaved("Profile saved.");
    } catch (saveError) {
      setError(errorMessage(saveError, "Could not save this profile."));
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault();
    setPwError("");
    setPwSaved("");
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
    setSaving(true);
    try {
      await apiClient.post("users/change-password/", {
        current_password: currentPw,
        new_password: newPw,
        confirm_password: confirmPw,
      });
      setPwSaved("Password updated.");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (passwordError) {
      setPwError(errorMessage(passwordError, "Could not update the password."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <PortalLoading variant="profile" title="Loading your profile" detail="Getting the account details for this sign-in." />;
  }

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <h1 className="profile-page-title">My Profile</h1>
        <p className="profile-page-sub">Manage your account information and security settings.</p>
      </div>

      {error && <p className="profile-pw-error" role="alert">{error}</p>}

      <div className="profile-grid">
        <div className="profile-avatar-card">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar-circle">
              {avatarSrc ? (
                <img src={avatarSrc} alt="" className="profile-avatar-img" />
              ) : (
                <span className="profile-avatar-initials">{initials}</span>
              )}
            </div>
            <button
              type="button"
              className="profile-avatar-upload-btn"
              onClick={() => fileRef.current?.click()}
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
          <h3 className="profile-avatar-name">{displayName}</h3>
          <p className="profile-avatar-email">{profile?.email || "No email on this account"}</p>
          <span className="profile-avatar-role-badge">
            <Shield size={11} />
            {roleName}
          </span>
          <p className="profile-avatar-hint">
            Choose a photo, then save. The image is stored with your account.
          </p>
        </div>

        <div className="profile-main-col">
          <form className="profile-info-card" onSubmit={handleSaveProfile}>
            <div className="profile-card-header">
              <User size={16} className="profile-card-icon" />
              <h2 className="profile-card-title">Personal Information</h2>
            </div>

            <div className="profile-form-row">
              <div className="profile-form-field">
                <label htmlFor="account-first-name">First name</label>
                <input
                  id="account-first-name"
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="profile-input"
                  required
                />
              </div>
              <div className="profile-form-field">
                <label htmlFor="account-last-name">Last name</label>
                <input
                  id="account-last-name"
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="profile-input"
                  required
                />
              </div>
            </div>

            <div className="profile-form-row">
              <div className="profile-form-field">
                <label htmlFor="account-email">Email address</label>
                <div className="profile-input-icon-wrap">
                  <Mail size={14} className="profile-input-icon" />
                  <input
                    id="account-email"
                    type="email"
                    value={profile?.email || ""}
                    readOnly
                    className="profile-input with-icon readonly"
                  />
                </div>
              </div>
              <div className="profile-form-field">
                <label htmlFor="account-username">Username</label>
                <input
                  id="account-username"
                  type="text"
                  value={profile?.username || ""}
                  readOnly
                  className="profile-input readonly"
                />
              </div>
            </div>

            <div className="profile-form-row">
              <div className="profile-form-field">
                <label htmlFor="account-role">Role</label>
                <input id="account-role" type="text" value={roleName} readOnly className="profile-input readonly" />
              </div>
              <div className="profile-form-field">
                <label htmlFor="account-institute">Institute</label>
                <input id="account-institute" type="text" value={instituteName} readOnly className="profile-input readonly" />
              </div>
            </div>

            {(studentNumber || academicProgram) && (
              <div className="profile-form-row">
                <div className="profile-form-field">
                  <label htmlFor="account-student-number">Student number</label>
                  <input id="account-student-number" type="text" value={studentNumber || "—"} readOnly className="profile-input readonly" />
                </div>
                <div className="profile-form-field">
                  <label htmlFor="account-program">Program</label>
                  <input id="account-program" type="text" value={academicProgram || "—"} readOnly className="profile-input readonly" />
                </div>
              </div>
            )}

            <div className="profile-form-actions">
              {saved && <span className="profile-save-success">{saved}</span>}
              <button type="submit" className="profile-save-btn" disabled={saving}>
                <Save size={14} />
                Save Changes
              </button>
            </div>
          </form>

          <form className="profile-info-card" onSubmit={handleChangePassword}>
            <div className="profile-card-header">
              <Lock size={16} className="profile-card-icon" />
              <h2 className="profile-card-title">Change Password</h2>
            </div>

            <div className="profile-form-row single">
              <div className="profile-form-field">
                <label htmlFor="account-current-password">Current Password</label>
                <PasswordInput
                  id="account-current-password"
                  value={currentPw}
                  onChange={(event) => setCurrentPw(event.target.value)}
                  className="profile-input"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="profile-form-row">
              <div className="profile-form-field">
                <label htmlFor="account-new-password">New Password</label>
                <PasswordInput
                  id="account-new-password"
                  value={newPw}
                  onChange={(event) => setNewPw(event.target.value)}
                  className="profile-input"
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
              <div className="profile-form-field">
                <label htmlFor="account-confirm-password">Confirm New Password</label>
                <PasswordInput
                  id="account-confirm-password"
                  value={confirmPw}
                  onChange={(event) => setConfirmPw(event.target.value)}
                  className="profile-input"
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
            </div>

            {pwError && <p className="profile-pw-error" role="alert">{pwError}</p>}

            <div className="profile-form-actions">
              {pwSaved && <span className="profile-save-success">{pwSaved}</span>}
              <button type="submit" className="profile-save-btn" disabled={saving}>
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
