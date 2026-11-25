import { useEffect, useRef, useState } from 'react';
import eclearanceLogo from '../assets/eclearance-logo.png';
import AccountMenu from '../components/AccountMenu.jsx';
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
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onSignOut,
  onOpenProfile,
  children,
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [filterTab, setFilterTab] = useState('All');
  const mobileBellRef = useRef(null);
  const desktopBellRef = useRef(null);
  const notesRef = useRef(null);
  useDismissOnOutside(showNotifications, () => setShowNotifications(false), mobileBellRef, desktopBellRef, notesRef);

  useEffect(() => {
    setShowNotifications(false);
  }, [activePage]);

  const unreadCount = notifications.filter((notification) => notification.unread).length;
  const notificationTabs = [
    { label: 'All', count: notifications.length },
    { label: 'Unread', count: unreadCount },
  ];
  const profileInitials = `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase() || "SG";

  const markAllAsRead = () => {
    onMarkAllNotificationsRead();
  };

  const displayedNotifications = notifications.filter(
    (notification) => filterTab === 'All' || notification.unread,
  );
  const todayList = displayedNotifications.filter((notification) => notification.group === 'TODAY');
  const earlierList = displayedNotifications.filter((notification) => notification.group !== 'TODAY');

  return (
    <div className="signatory-shell" style={{ backgroundColor: '#D7DCD0', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", padding: '1rem 1.5rem' }}>
      <div className="signatory-mobile-top">
        <button type="button" className="signatory-mobile-brand" aria-label="Refresh" onClick={requestPortalRefresh}>
          <img src={eclearanceLogo} alt="" />
          <span>
            <strong>Davao del Norte State College</strong>
            <small>Signatory portal</small>
          </span>
        </button>
        <div className="signatory-mobile-actions">
          <button
            type="button"
            ref={mobileBellRef}
            className="signatory-mobile-bell"
            data-notification-toggle=""
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            onClick={() => {
              setShowNotifications((isOpen) => !isOpen);
              setShowProfileMenu(false);
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && <span>{unreadCount}</span>}
          </button>
          <button
            type="button"
            className="signatory-mobile-profile"
            aria-label="Open account menu"
            onClick={() => setShowProfileMenu((open) => !open)}
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
        </div>
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
      <nav className="signatory-mobile-bottom" aria-label="Signatory">
        {navTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activePage === tab.id ? 'active' : ''}
            onClick={() => onSelectPage(tab.id)}
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
          backgroundColor: '#2E3D28',
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
                onClick={() => onSelectPage(tab.id)}
                style={{
                  backgroundColor: 'transparent',
                  color: isActive ? '#FFFFFF' : '#B6C798',
                  border: 'none',
                  padding: 0,
                  borderRadius: '999px',
                  fontWeight: '500',
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
                  backgroundColor: isActive ? '#51664C' : 'transparent',
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
          {/* Notification Button */}
          <button
            type="button"
            ref={desktopBellRef}
            data-notification-toggle=""
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={showNotifications}
            onClick={() => {
              setShowNotifications((isOpen) => !isOpen);
              setShowProfileMenu(false);
            }}
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              color: '#2E3D28',
              border: 'none',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <svg
              aria-hidden="true"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: 4,
                right: 4,
                backgroundColor: '#AA5757',
                color: '#fff',
                width: 16,
                height: 16,
                borderRadius: '50%',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                display: 'grid',
                placeItems: 'center'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Profile Button */}
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
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

          {/* Dropdown Profile Menu */}
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
      </header>

      {/* Page Body View */}
      <main className="signatory-main">
        {children}
      </main>

      {showNotifications && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setShowNotifications(false)}
            style={{
              position: 'fixed',
              inset: 0,
              width: '100%',
              height: '100%',
              padding: 0,
              border: 'none',
              backgroundColor: 'rgba(0,0,0,0.15)',
              zIndex: 999,
              cursor: 'default',
            }}
          />
          <aside
            ref={notesRef}
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
            style={{
              position: 'fixed',
              top: '1rem',
              right: '1rem',
              bottom: '1rem',
              width: 'min(380px, calc(100vw - 2rem))',
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.18)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '1.2rem 1.2rem 0.8rem', borderBottom: '1px solid #F0F4EC' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#29352A' }}>Notifications</h2>
                  {unreadCount > 0 && (
                    <span style={{
                      backgroundColor: '#AA5757',
                      color: '#FFF',
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '12px',
                    }}>
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Close notifications"
                  onClick={() => setShowNotifications(false)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: '#EDF1E8',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    color: '#74806E',
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.3rem', backgroundColor: '#EDF1E8', padding: '0.2rem', borderRadius: '20px' }}>
                  {notificationTabs.map((tab) => (
                    <button
                      key={tab.label}
                      type="button"
                      aria-pressed={filterTab === tab.label}
                      onClick={() => setFilterTab(tab.label)}
                      style={{
                        backgroundColor: filterTab === tab.label ? '#2E3D28' : 'transparent',
                        color: filterTab === tab.label ? '#FFF' : '#29352A',
                        border: 'none',
                        padding: '0.3rem 0.8rem',
                        borderRadius: '16px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#51664C',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ✓ Mark All as Read
                  </button>
                )}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.2rem' }}>
              {todayList.length > 0 && (
                <NotificationGroup
                  title="TODAY"
                  items={todayList}
                  onMarkAsRead={onMarkNotificationRead}
                />
              )}
              {earlierList.length > 0 && (
                <NotificationGroup
                  title="EARLIER"
                  items={earlierList}
                  onMarkAsRead={onMarkNotificationRead}
                />
              )}
              {displayedNotifications.length === 0 && (
                <div style={{ textAlign: 'center', color: '#74806E', padding: '3rem 1rem', fontSize: '0.85rem' }}>
                  <strong>{filterTab === 'Unread' ? 'No unread notifications' : 'No notifications yet'}</strong>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', opacity: 0.8 }}>
                    You will be notified here once someone submits an approval request or clearance proof.
                  </p>
                </div>
              )}
            </div>

          </aside>
        </>
      )}
    </div>
  );
}

function NotificationGroup({ title, items, onMarkAsRead }) {
  return (
    <section>
      <h3 style={{ fontSize: '0.68rem', fontWeight: '800', color: '#74806E', letterSpacing: '0.05em', margin: '0 0 0.6rem' }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onMarkAsRead(item.id)}
            style={{
              width: '100%',
              backgroundColor: item.unread ? '#F6F8F4' : '#FFFFFF',
              border: item.unread ? '1px solid #E2E7DC' : '1px solid transparent',
              borderRadius: '16px',
              padding: '0.85rem',
              display: 'flex',
              gap: '0.75rem',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <span style={{ flex: 1 }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: '700', fontSize: '0.82rem', color: '#29352A', lineHeight: 1.2 }}>
                  {item.title}
                </span>
                {item.unread && <span aria-label="Unread" style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#2E3D28', flexShrink: 0, marginTop: 4 }} />}
              </span>
              <span style={{ display: 'block', margin: '0.3rem 0 0.4rem', fontSize: '0.74rem', color: '#51664C', lineHeight: 1.35 }}>
                {item.desc}
              </span>
              <span style={{ fontSize: '0.68rem', color: '#74806E' }}>{item.time}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}