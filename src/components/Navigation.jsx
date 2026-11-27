import { useRef, useState } from "react";
import eclearanceLogo from "../assets/eclearance-logo.png";
import { signOut } from "../services/auth";
import AccountMenu from "./AccountMenu.jsx";
import NotificationMenu from "./NotificationMenu.jsx";
import { usePortalNotifications } from "../services/usePortalNotifications.js";
import { requestPortalRefresh } from "../services/portalRefresh.js";
import { useDismissOnOutside } from "../services/useDismissOnOutside.js";
import "../styles/navigation.css";

function Navigation({
  activeTab,
  setActiveTab,
  avatarUrl,
  userInitials,
  displayName = "Student",
  email = "",
  roleName = "Student",
  injectedAlert,
  clearInjectedAlert,
}) {
  const [showNotification, setShowNotification] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);
  useDismissOnOutside(showProfile, () => setShowProfile(false), profileRef);

  const {
    notifications,
    unreadCount,
    error: notificationError,
    markRead,
    markAllRead,
  } = usePortalNotifications({ injectedAlert, onClearInjectedAlert: clearInjectedAlert });

  const toggleNotification = () => {
    setShowNotification((open) => !open);
    setShowProfile(false);
  };

  const toggleProfile = () => {
    setShowProfile((open) => !open);
    setShowNotification(false);
  };

  const handleTabClick = (e, tabName) => {
    e.preventDefault();
    setActiveTab(tabName);
    setShowProfile(false);
    setShowNotification(false);
  };

  return (
    <nav className="navigation-wrapper">
      <button
        type="button"
        className="logo-section desktop-brand"
        aria-label="Refresh"
        onClick={requestPortalRefresh}
      >
        <img src={eclearanceLogo} alt="E-Clearance" />
        <span className="desktop-brand-info">
          <strong>Davao del Norte State College</strong>
          <small>Student portal</small>
        </span>
      </button>

      <div className="navigation-card">
        <ul className="menu-section">
          <li>
            <a
              href="#"
              className={activeTab === "dashboard" ? "active-link" : ""}
              onClick={(e) => handleTabClick(e, "dashboard")}
            >
              Dashboard
            </a>
          </li>
          <li>
            <a
              href="#"
              className={activeTab === "request" ? "active-link" : ""}
              onClick={(e) => handleTabClick(e, "request")}
            >
              Clearance Request
            </a>
          </li>
          <li>
            <a
              href="#"
              className={activeTab === "track" ? "active-link" : ""}
              onClick={(e) => handleTabClick(e, "track")}
            >
              Tracker
            </a>
          </li>
          <li>
            <a
              href="#"
              className={activeTab === "history" ? "active-link" : ""}
              onClick={(e) => handleTabClick(e, "history")}
            >
              History
            </a>
          </li>
          <li>
            <a
              href="#"
              className={activeTab === "download" ? "active-link" : ""}
              onClick={(e) => handleTabClick(e, "download")}
            >
              Clearance
            </a>
          </li>
        </ul>
      </div>

      <div className="right-icons">
        <NotificationMenu
          notifications={notifications}
          unreadCount={unreadCount}
          open={showNotification}
          onToggle={toggleNotification}
          onClose={() => setShowNotification(false)}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
          error={notificationError}
          emptyHint="Updates on your clearance requirements and approvals will appear here."
        />

        <div className="profile-container" ref={profileRef}>
          <button
            type="button"
            className={`profile-btn ${showProfile ? "active" : ""}`}
            onClick={toggleProfile}
            aria-label="Open account menu"
            aria-expanded={showProfile}
          >
            <div className="profile-circle-placeholder" style={{ display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              ) : (
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#3a3c30", fontStyle: "normal" }}>{userInitials}</span>
              )}
            </div>
            <span className="profile-identity">
              <strong>{displayName}</strong>
              <small>{roleName}</small>
            </span>
            <span className="profile-caret" aria-hidden="true">▾</span>
          </button>

          {showProfile && (
            <AccountMenu
              avatarUrl={avatarUrl}
              initials={userInitials}
              displayName={displayName}
              email={email}
              roleName={roleName}
              onProfile={(event) => handleTabClick(event, "profile")}
              onLogout={signOut}
            />
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
