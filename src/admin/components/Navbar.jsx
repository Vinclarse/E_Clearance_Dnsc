import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Bell, User, Settings, LogOut, Menu, X } from "lucide-react";
import { signOut } from "../../services/auth.js";
import { fetchCurrentAdmin, fetchUnreadCount } from "../services/dashboardApi.js";
import "./Navbar.css";

const navLinks = [
  { to: "/",                    label: "Executive Dashboard"   },
  { to: "/clearance-templates", label: "Clearance Templates"   },
  { to: "/student-directory",   label: "Student Directory"     },
  { to: "/signatory-roles",     label: "Signatory Roles"       },
  { to: "/audit-logs",          label: "Audit Logs"            },
];

export default function Navbar() {
  const [showMenu,   setShowMenu]   = useState(false);
  const [navOpen,    setNavOpen]    = useState(false);
  const [menuPos,    setMenuPos]    = useState({ top: 0, right: 0 });
  const [notifCount, setNotifCount] = useState(0);
  const [profile,    setProfile]    = useState(null);
  const triggerRef                  = useRef(null);
  const dropdownRef                 = useRef(null);

  useEffect(() => {
    let active = true;
    Promise.allSettled([fetchCurrentAdmin(), fetchUnreadCount()]).then(([account, unread]) => {
      if (!active) return;
      if (account.status === "fulfilled") setProfile(account.value);
      if (unread.status === "fulfilled") setNotifCount(unread.value);
    });
    return () => {
      active = false;
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

  /* ── Open / close ── */
  function handleTrigger() {
    if (!showMenu && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setShowMenu((v) => !v);
  }

  /* ── Close on outside click ── */
  useEffect(() => {
    function onOutside(e) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        triggerRef.current  && !triggerRef.current.contains(e.target)
      ) setShowMenu(false);
    }
    if (showMenu) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [showMenu]);

  /* ── Reposition on resize / scroll ── */
  useEffect(() => {
    function reposition() {
      if (showMenu && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
      }
    }
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [showMenu]);

  function handleLogout() {
    localStorage.removeItem("admin_user");
    setShowMenu(false);
    signOut();
  }

  return (
    <div className="nb-wrapper">

      {/* ── SECTION 1: Brand (white card — far left, OUTSIDE dark pill) ── */}
      <div className="nb-brand">
        <div className="nb-logo">
          <img src="/dnsc-logo.jpg" alt="DNSC Logo" className="nb-logo-img" />
        </div>
        <div className="nb-brand-text">
          <span className="nb-brand-name">Davao del Norte State College</span>
          <span className="nb-brand-sub">{brandSub}</span>
        </div>
      </div>

      <button
        type="button"
        className="nb-menu-btn"
        aria-label={navOpen ? "Close menu" : "Open menu"}
        aria-expanded={navOpen}
        onClick={() => setNavOpen((open) => !open)}
      >
        {navOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* ── SECTION 2: Dark pill — nav links only ── */}
      <nav className={"nb-pill" + (navOpen ? " nb-pill--open" : "")}>
        <ul className="nb-nav">
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) => "nb-link" + (isActive ? " nb-link--active" : "")}
                onClick={() => setNavOpen(false)}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── SECTION 3: Bell — standalone circle ── */}
      <button className="nb-bell" aria-label="Notifications">
        <Bell size={16} strokeWidth={1.8} />
        {notifCount > 0 && (
          <span className="nb-bell-badge">{notifCount}</span>
        )}
      </button>

      {/* ── SECTION 4: Profile pill — far right ── */}
      <button
        ref={triggerRef}
        className={"nb-profile" + (showMenu ? " nb-profile--open" : "")}
        onClick={handleTrigger}
        aria-expanded={showMenu}
      >
        {/* Avatar circle */}
        <div className="nb-avatar">
          <img src="/dnsc-logo.jpg" alt="avatar" />
        </div>
        {/* Name + role */}
        <div className="nb-user-text">
          <span className="nb-user-name">{displayName}</span>
          <span className="nb-user-role">{roleName}</span>
        </div>
        {/* Triangle caret ▼ */}
        <span className={"nb-caret" + (showMenu ? " nb-caret--up" : "")}>▾</span>
      </button>

      {/* ── Dropdown (fixed, escapes stacking context) ── */}
      {showMenu && (
        <div
          ref={dropdownRef}
          className="nb-dropdown"
          style={{ top: menuPos.top, right: menuPos.right }}
        >
          <div className="nb-dd-header">
            <div className="nb-dd-avatar-lg">
              <img src="/dnsc-logo.jpg" alt="DNSC" />
            </div>
            <div className="nb-dd-info">
              <p className="nb-dd-name">{displayName}</p>
              <p className="nb-dd-email">{email || "Signed-in administrator"}</p>
              <span className="nb-dd-role-badge">{roleName}</span>
            </div>
          </div>

          <div className="nb-dd-divider" />

          <NavLink to="/profile" className="nb-dd-item" onClick={() => setShowMenu(false)}>
            <User size={14} /> My Profile
          </NavLink>
          <NavLink to="/settings" className="nb-dd-item" onClick={() => setShowMenu(false)}>
            <Settings size={14} /> Settings
          </NavLink>

          <div className="nb-dd-divider" />

          <button className="nb-dd-item nb-dd-item--danger" onClick={handleLogout}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
