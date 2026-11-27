import { useRef, useState } from "react";
import eclearanceLogo from "../assets/eclearance-logo.png";
import { signOut } from "../services/auth";
import AccountMenu from "./AccountMenu.jsx";
import NotificationMenu from "./NotificationMenu.jsx";
import { usePortalNotifications } from "../services/usePortalNotifications.js";
import { requestPortalRefresh } from "../services/portalRefresh.js";
import { useDismissOnOutside } from "../services/useDismissOnOutside.js";
import "../styles/navigation.css";

function MobileNavigation({
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

  const closePopups = () => {
    setShowNotification(false);
    setShowProfile(false);
  };

  const toggleNotification = () => {
    setShowNotification((open) => !open);
    setShowProfile(false);
  };

  const toggleProfile = () => {
    setShowProfile((open) => !open);
    setShowNotification(false);
  };

  const goTo = (tab) => {
    setActiveTab(tab);
    closePopups();
  };

  const navItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      match: ["dashboard"],
      icon: (
        <>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </>
      ),
    },
    {
      key: "request",
      label: "Request",
      match: ["request"],
      icon: (
        <>
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </>
      ),
    },
    {
      key: "track",
      label: "Tracker",
      match: ["track"],
      icon: (
        <>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </>
      ),
    },
    {
      key: "history",
      label: "History",
      match: ["history"],
      icon: (
        <>
          <circle cx="12" cy="12" r="9"></circle>
          <polyline points="12 7 12 12 15 15"></polyline>
        </>
      ),
    },
    {
      key: "clearance",
      label: "Clearance",
      match: ["clearance", "download"],
      icon: (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </>
      ),
    },
  ];

  return (
    <>
      {(showNotification || showProfile) && (
        <div className="mobile-popup-overlay" onClick={closePopups}></div>
      )}

      {/* ===== Top bar ===== */}
      <div className="mobile-top-bar">
        <div className="mobile-top-main">
          <button type="button" className="mobile-left-section" aria-label="Refresh" onClick={requestPortalRefresh}>
            <div className="mobile-logo-badge">
              <img src={eclearanceLogo} alt="E-Clearance" />
            </div>
            <div className="mobile-brand-info">
              <h2>Davao del Norte State College</h2>
              <p>Student portal</p>
            </div>
          </button>
        </div>

        <div className="right-icons">
          <NotificationMenu
            compact
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
              className={`profile-btn mobile-profile-pill ${showProfile ? "active" : ""}`}
              onClick={toggleProfile}
              aria-label="Open account menu"
              aria-expanded={showProfile}
            >
              <div
                className="profile-circle-placeholder"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                ) : (
                  <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#3a3c30" }}>{userInitials}</span>
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
                onProfile={() => goTo("profile")}
                onLogout={signOut}
              />
            )}
          </div>
        </div>
      </div>

      {/* ===== Bottom nav ===== */}
      <div className="mobile-bottom-nav">
        {navItems.map((item) => (
          <button
            type="button"
            key={item.key}
            className={`mobile-nav-item ${item.match.includes(activeTab) ? "active" : ""}`}
            onClick={() => goTo(item.key)}
            aria-current={item.match.includes(activeTab) ? "page" : undefined}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {item.icon}
            </svg>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

export default MobileNavigation;
