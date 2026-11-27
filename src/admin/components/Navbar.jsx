import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X, LayoutDashboard, FileText, Users, BadgeCheck, ScrollText } from "lucide-react";
import eclearanceLogo from "../../assets/eclearance-logo.png";
import AccountMenu from "../../components/AccountMenu.jsx";
import NotificationMenu from "../../components/NotificationMenu.jsx";
import { signOut } from "../../services/auth.js";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/notifications.js";
import { fetchCurrentAdmin, fetchUnreadCount } from "../services/dashboardApi.js";
import { requestPortalRefresh, subscribeAccount, subscribePortalRefresh } from "../../services/portalRefresh.js";
import { useDismissOnOutside } from "../../services/useDismissOnOutside.js";
import "./Navbar.css";

const navLinks = [
  { to: "/",                    label: "Executive Dashboard", short: "Dashboard", icon: LayoutDashboard },
  { to: "/clearance-templates", label: "Clearance Templates", short: "Templates", icon: FileText },
  { to: "/student-directory",   label: "Student Directory",   short: "Students",  icon: Users },
  { to: "/signatory-roles",     label: "Signatory Roles",     short: "Roles",     icon: BadgeCheck },
  { to: "/audit-logs",          label: "Audit Logs",          short: "Audit",     icon: ScrollText },
];

export default function Navbar() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [notices, setNotices] = useState([]);
  const [showNotes, setShowNotes] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [profile, setProfile] = useState(null);
  const desktopProfileRef = useRef(null);
  const mobileProfileRef = useRef(null);

  useDismissOnOutside(
    showMenu || showAccount,
    () => {
      setShowMenu(false);
      setShowAccount(false);
    },
    desktopProfileRef,
    mobileProfileRef,
  );

  useEffect(() => {
    let active = true;
    function loadHeader() {
      Promise.allSettled([fetchCurrentAdmin(), fetchUnreadCount(), fetchNotifications()]).then(([account, unread, notes]) => {
        if (!active) return;
        if (account.status === "fulfilled") setProfile(account.value);
        if (unread.status === "fulfilled") setNotifCount(unread.value);
        if (notes.status === "fulfilled") setNotices(notes.value);
      });
    }
    loadHeader();
    const stopRefresh = subscribePortalRefresh(loadHeader);
    const stopAccount = subscribeAccount((account) => {
      if (active && account) setProfile(account);
    });
    return () => {
      active = false;
      stopRefresh();
      stopAccount();
    };
  }, []);

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  const displayName = fullName || profile?.username || "Administrator";
  const roleName = Array.isArray(profile?.groups) && profile.groups.length
    ? String(profile.groups[0]?.name ?? profile.groups[0])
    : "Administrator";
  const email = profile?.email || "";
  const instituteName = profile?.institute?.institute_name;
  const brandSub = instituteName ? `Administration · ${instituteName}` : "Administration";
  const avatarUrl = [profile?.profile_url, profile?.profile].find((value) => typeof value === "string" && value.startsWith("http"));
  const initials = displayName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "A";

  function handleMarkNoticeRead(id) {
    let decremented = false;
    setNotices((items) =>
      items.map((item) => {
        if (item.id !== id) return item;
        if (item.unread || item.is_read === false) decremented = true;
        return { ...item, is_read: true, unread: false };
      }),
    );
    if (decremented) {
      setNotifCount((count) => Math.max(0, count - 1));
    }
    markNotificationRead(id).catch(() => {});
  }

  async function handleMarkNotesRead() {
    setNoteError("");
    try {
      await markAllNotificationsRead();
      setNotices((items) => items.map((item) => ({ ...item, is_read: true, unread: false })));
      setNotifCount(0);
    } catch (error) {
      setNoteError(error?.message || "Could not mark notifications as read.");
    }
  }

  function closePopovers() {
    setShowNotes(false);
    setShowMenu(false);
    setShowAccount(false);
  }

  function handleNavigate(path) {
    closePopovers();
    setNavOpen(false);
    navigate(path);
  }

  function handleLogout() {
    localStorage.removeItem("admin_user");
    closePopovers();
    signOut();
  }

  return (
    <>
      <div className="portal-mobile-top">
        <button
          type="button"
          className="portal-mobile-brand"
          aria-label="Refresh"
          onClick={() => {
            closePopovers();
            requestPortalRefresh();
          }}
        >
          <img src={eclearanceLogo} alt="" />
          <span>
            <strong>Davao del Norte State College</strong>
            <small>Admin portal</small>
          </span>
        </button>

        <div className="portal-mobile-actions">
          <NotificationMenu
            compact
            notifications={notices}
            unreadCount={notifCount}
            open={showNotes}
            onToggle={() => {
              setShowNotes((open) => !open);
              setShowAccount(false);
            }}
            onClose={() => setShowNotes(false)}
            onMarkRead={handleMarkNoticeRead}
            onMarkAllRead={handleMarkNotesRead}
            error={noteError}
            emptyHint="System notifications and clearance activity updates will appear here."
          />

          <div className="nb-profile-wrap" ref={mobileProfileRef}>
            <button
              type="button"
              className="portal-mobile-profile"
              aria-label="Open account menu"
              aria-expanded={showAccount}
              onClick={() => {
                setShowAccount((open) => !open);
                setShowNotes(false);
              }}
            >
              {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{initials}</span>}
              <small>▾</small>
            </button>

            {showAccount && (
              <AccountMenu
                avatarUrl={avatarUrl}
                initials={initials}
                displayName={displayName}
                email={email || "Signed-in administrator"}
                roleName={roleName}
                onProfile={() => handleNavigate("/profile")}
                onSettings={() => handleNavigate("/settings")}
                onLogout={handleLogout}
              />
            )}
          </div>
        </div>
      </div>

      <nav className="portal-mobile-bottom" aria-label="Admin">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) => "portal-mobile-tab" + (isActive ? " active" : "")}
              onClick={closePopovers}
            >
              <Icon size={20} strokeWidth={1.8} />
              <span>{link.short}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="nb-wrapper">
        {/* ── SECTION 1: Brand ── */}
        <button
          type="button"
          className="nb-brand"
          aria-label="Refresh"
          onClick={() => {
            closePopovers();
            requestPortalRefresh();
          }}
        >
          <div className="nb-logo">
            <img src={eclearanceLogo} alt="" className="nb-logo-img" />
          </div>
          <div className="nb-brand-text">
            <span className="nb-brand-name">Davao del Norte State College</span>
            <span className="nb-brand-sub">{brandSub}</span>
          </div>
        </button>

        <button
          type="button"
          className="nb-menu-btn"
          aria-label={navOpen ? "Close menu" : "Open menu"}
          aria-expanded={navOpen}
          onClick={() => setNavOpen((open) => !open)}
        >
          {navOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* ── SECTION 2: Dark pill — nav links ── */}
        <nav className={"nb-pill" + (navOpen ? " nb-pill--open" : "")}>
          <ul className="nb-nav">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) => "nb-link" + (isActive ? " nb-link--active" : "")}
                  onClick={() => {
                    closePopovers();
                    setNavOpen(false);
                  }}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── SECTION 3: Unified Bell ── */}
        <NotificationMenu
          notifications={notices}
          unreadCount={notifCount}
          open={showNotes}
          onToggle={() => {
            setShowNotes((open) => !open);
            setShowMenu(false);
          }}
          onClose={() => setShowNotes(false)}
          onMarkRead={handleMarkNoticeRead}
          onMarkAllRead={handleMarkNotesRead}
          error={noteError}
          emptyHint="System notifications and clearance activity updates will appear here."
        />

        {/* ── SECTION 4: Profile pill & Unified AccountMenu ── */}
        <div className="nb-profile-wrap" ref={desktopProfileRef}>
          <button
            type="button"
            className={"nb-profile" + (showMenu ? " nb-profile--open" : "")}
            onClick={() => {
              setShowMenu((open) => !open);
              setShowNotes(false);
            }}
            aria-expanded={showMenu}
          >
            <div className="nb-avatar">
              {avatarUrl ? <img src={avatarUrl} alt="" /> : <span className="nb-avatar-initials">{initials}</span>}
            </div>
            <div className="nb-user-text">
              <span className="nb-user-name">{displayName}</span>
              <span className="nb-user-role">{roleName}</span>
            </div>
            <span className={"nb-caret" + (showMenu ? " nb-caret--up" : "")}>▾</span>
          </button>

          {showMenu && (
            <AccountMenu
              avatarUrl={avatarUrl}
              initials={initials}
              displayName={displayName}
              email={email || "Signed-in administrator"}
              roleName={roleName}
              onProfile={() => handleNavigate("/profile")}
              onSettings={() => handleNavigate("/settings")}
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>
    </>
  );
}
