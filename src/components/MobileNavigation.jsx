import { useState, useEffect } from "react";
import eclearanceLogo from "../assets/eclearance-logo.png";
import { signOut } from "../services/auth";
import AccountMenu from "./AccountMenu.jsx";
import { fetchNotifications, markAllNotificationsRead } from "../services/notifications";
import { requestPortalRefresh, subscribePortalRefresh } from "../services/portalRefresh.js";
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
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [readInjectedAlertId, setReadInjectedAlertId] = useState(null);
  const [notificationError, setNotificationError] = useState("");

  useEffect(() => {
    let isMounted = true;
    function loadNotifications() {
      fetchNotifications()
        .then((items) => {
          if (!isMounted) return;
          setNotifications(items);
          setHasUnread(items.some((item) => !item.is_read));
        })
        .catch((error) => {
          if (!isMounted) return;
          console.error("Failed to load notifications:", error);
          setNotificationError("Could not load notifications. Please try again.");
        });
    }
    loadNotifications();
    const stopRefresh = subscribePortalRefresh(loadNotifications);
    return () => {
      isMounted = false;
      stopRefresh();
    };
  }, []);

  const notificationsToDisplay = injectedAlert
    ? [injectedAlert, ...notifications]
    : notifications;
  const hasUnreadNotifications =
    hasUnread || Boolean(injectedAlert && injectedAlert.id !== readInjectedAlertId);

  const closePopups = () => {
    setShowNotification(false);
    setShowProfile(false);
  };

  const toggleNotification = () => {
    const next = !showNotification;
    setShowNotification(next);
    setShowProfile(false);
  };

  const toggleProfile = () => {
    setShowProfile(!showProfile);
    setShowNotification(false);
  };

  const goTo = (tab) => {
    setActiveTab(tab);
    closePopups();
  };

  const handleClearNotifications = async (e) => {
    e.stopPropagation();
    setNotificationError("");
    try {
      await markAllNotificationsRead();
      setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
      setHasUnread(false);
      setReadInjectedAlertId(injectedAlert?.id ?? null);
      clearInjectedAlert?.();
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
      setNotificationError("Could not mark notifications as read. Please try again.");
    }
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
      label: "My Request",
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
      {/* Tap outside to close any open popup */}
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

          <div className="notification-container">
            <button
              type="button"
              className={`notification-btn ${showNotification ? "active" : ""}`}
              onClick={toggleNotification}
              aria-label="Notifications"
              aria-expanded={showNotification}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {hasUnreadNotifications && (
                <div className={`notification-dot ${notificationsToDisplay.some((n) => n.type === "danger") ? "danger-red" : ""}`}></div>
              )}
            </button>

            {/* Same markup/classes as the desktop popup, so the styling is identical */}
            {showNotification && (
              <div className="notification-modal mobile-modal">
                <div className="notification-modal-header">
                  <h5>System Notifications</h5>
                  {notificationsToDisplay.length > 0 && (
                    <button type="button" onClick={handleClearNotifications}>Mark all read</button>
                  )}
                </div>
                <div className="notification-modal-body-list">
                  {notificationError && <div className="empty-notification-state" role="alert">{notificationError}</div>}
                  {notificationsToDisplay.length === 0 ? (
                    <div className="empty-notification-state">
                      {!notificationError && "No notifications to display."}
                    </div>
                  ) : (
                    notificationsToDisplay.map((notif) => (
                      <div className={`notification-item-card-row ${notif.type}`} key={notif.id}>
                        <p>{notif.text}</p>
                        <span>{notif.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="right-icons">
          <div className="profile-container">
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