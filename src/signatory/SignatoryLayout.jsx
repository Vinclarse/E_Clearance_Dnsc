import { useRef, useState } from 'react';
import eclearanceLogo from '../assets/eclearance-logo.png';
import AccountMenu from '../components/AccountMenu.jsx';
import NotificationMenu from '../components/NotificationMenu.jsx';
import { requestPortalRefresh } from '../services/portalRefresh.js';
import { useDismissOnOutside } from '../services/useDismissOnOutside.js';

const navTabs = [
  {
    id: 'SIG1',
    label: 'Overview Dashboard',
    short: 'Overview',
    icon: (
      <>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    ),
  },
  {
    id: 'SIG2',
    label: 'Approval Queue',
    short: 'Queue',
    icon: (
      <>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </>
    ),
  },
  {
    id: 'SIG3',
    label: 'Deficiencies & Proofs',
    short: 'Proofs',
    icon: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </>
    ),
  },
  {
    id: 'SIG5',
    label: 'Cohort Overview',
    short: 'Cohort',
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
];

export default function SignatoryLayout({
  activePage,
  onSelectPage,
  profile,
  notifications,
  notificationError = "",
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onSignOut,
  onOpenProfile,
  children,
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const desktopProfileRef = useRef(null);
  const mobileProfileRef = useRef(null);
  useDismissOnOutside(showProfileMenu, () => setShowProfileMenu(false), desktopProfileRef, mobileProfileRef);

  const unreadCount = notifications.filter((notification) => Boolean(notification.unread ?? (notification.is_read === false))).length;
  const profileInitials = `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase() || "SG";

  const handleSelectPage = (pageId) => {
    setShowNotifications(false);
    setShowProfileMenu(false);
    onSelectPage(pageId);
  };

  const toggleNotifications = () => {
    setShowNotifications((isOpen) => !isOpen);
    setShowProfileMenu(false);
  };

  const toggleProfile = () => {
    setShowProfileMenu((isOpen) => !isOpen);
    setShowNotifications(false);
  };

  return (
    <div className="signatory-shell" style={{ backgroundColor: '#f5f4ef', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", padding: '1rem 1.5rem' }}>
      <div className="signatory-mobile-top">
        <button
          type="button"
          className="signatory-mobile-brand"
          aria-label="Refresh"
          onClick={() => {
            setShowNotifications(false);
            setShowProfileMenu(false);
            requestPortalRefresh();
          }}
        >
          <img src={eclearanceLogo} alt="" />
          <span>
            <strong>Davao del Norte State College</strong>
            <small>Signatory portal</small>
          </span>
        </button>
        <div className="signatory-mobile-actions">
          <NotificationMenu
            compact
            notifications={notifications}
            unreadCount={unreadCount}
            open={showNotifications}
            onToggle={toggleNotifications}
            onClose={() => setShowNotifications(false)}
            onMarkRead={onMarkNotificationRead}
            onMarkAllRead={onMarkAllNotificationsRead}
            error={notificationError}
            emptyHint="You will be notified here once someone submits an approval request or clearance proof."
          />

          <div ref={mobileProfileRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="signatory-mobile-profile"
              aria-label="Open account menu"
              aria-expanded={showProfileMenu}
              onClick={toggleProfile}
            >
              <span className="signatory-mobile-avatar">
                {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : profileInitials}
              </span>
              <span className="signatory-mobile-identity">
                <strong>{profile.displayName}</strong>
                <small>{profile.role}</small>
              </span>
              <small className="signatory-mobile-caret">▾</small>
            </button>

            {showProfileMenu && (
              <div className="signatory-mobile-account">
                <AccountMenu
                  avatarUrl={profile.avatarUrl}
                  initials={profileInitials}
                  displayName={profile.displayName}
                  email={profile.email}
                  roleName={profile.role}
                  onProfile={() => {
                    setShowProfileMenu(false);
                    onOpenProfile?.();
                  }}
                  onLogout={() => onSignOut?.()}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className="signatory-mobile-bottom" aria-label="Signatory">
        {navTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activePage === tab.id ? 'active' : ''}
            onClick={() => handleSelectPage(tab.id)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {tab.icon}
            </svg>
            <span>{tab.short}</span>
          </button>
        ))}
      </nav>

      {/* Top Header Card */}
      <header className="signatory-header" style={{
        backgroundColor: 'transparent',
        borderRadius: 0,
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: '1.2rem',
        boxShadow: 'none'
      }}>

        {/* Left: Institute Brand */}
        <button type="button" className="signatory-brand" aria-label="Refresh" onClick={requestPortalRefresh} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', height: 54, boxSizing: 'border-box', background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 999, padding: '6px 16px 6px 8px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', flexShrink: 0, font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
          <img
            src={eclearanceLogo}
            alt="E-Clearance"
            style={{ width: 40, height: 40, objectFit: 'contain', background: 'transparent' }}
          />
          <div>
            <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#29352A' }}>Davao del Norte State College</div>
            <div style={{ fontSize: '0.72rem', color: '#74806E' }}>Signatory portal</div>
          </div>
        </button>

        {/* Center: Main Pill Navigation */}
        <nav className="signatory-nav" style={{
          backgroundColor: '#2d3a1e',
          padding: '6px 8px',
          height: 54,
          boxSizing: 'border-box',
          borderRadius: 999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.2rem',
          flex: 1,
        }}>
          {navTabs.map((tab) => {
            const isActive = activePage === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectPage(tab.id)}
                style={{
                  backgroundColor: 'transparent',
                  color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                  border: 'none',
                  padding: 0,
                  borderRadius: '999px',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: '1 1 0',
                  minWidth: 0,
                  height: '100%',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{
                  backgroundColor: isActive ? '#4a5e30' : 'transparent',
                  borderRadius: '999px',
                  padding: '8px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  width: '100%',
                  height: '100%',
                  boxSizing: 'border-box',
                  whiteSpace: 'nowrap',
                  transition: 'background-color 0.15s ease'
                }}>
                  {tab.label}
                  {tab.badge && (
                    <span style={{
                      backgroundColor: '#91A778',
                      color: '#293B2A',
                      fontSize: '0.6rem',
                      fontWeight: '800',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '8px'
                    }}>
                      {tab.badge}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right: Notifications & User Avatar */}
        <div className="signatory-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
          <NotificationMenu
            notifications={notifications}
            unreadCount={unreadCount}
            open={showNotifications}
            onToggle={toggleNotifications}
            onClose={() => setShowNotifications(false)}
            onMarkRead={onMarkNotificationRead}
            onMarkAllRead={onMarkAllNotificationsRead}
            error={notificationError}
            emptyHint="You will be notified here once someone submits an approval request or clearance proof."
          />

          {/* Profile Button */}
          <div ref={desktopProfileRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={toggleProfile}
              aria-expanded={showProfileMenu}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#1a2810',
                padding: '0.3rem 0.8rem 0.3rem 0.3rem',
                height: 54,
                minHeight: 54,
                boxSizing: 'border-box',
                border: '1px solid rgba(0,0,0,0.09)',
                borderRadius: '999px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: '#2E3D28',
                color: '#FFF',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                overflow: 'hidden',
              }}>
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : profileInitials}
              </div>
              <div>
                <div className="signatory-profile-copy" style={{ fontSize: '0.8rem', fontWeight: '700', lineHeight: 1.1 }}>{profile.displayName}</div>
                <div className="signatory-profile-copy" style={{ fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{profile.role}</div>
              </div>
              <span style={{ fontSize: '0.7rem' }}>▼</span>
            </button>

            {showProfileMenu && (
              <AccountMenu
                avatarUrl={profile.avatarUrl}
                initials={profileInitials}
                displayName={profile.displayName}
                email={profile.email}
                roleName={profile.role}
                onProfile={() => {
                  setShowProfileMenu(false);
                  onOpenProfile?.();
                }}
                onLogout={() => onSignOut?.()}
              />
            )}
          </div>
        </div>
      </header>

      {/* Page Body View */}
      <main className="signatory-main">
        {children}
      </main>
    </div>
  );
}
