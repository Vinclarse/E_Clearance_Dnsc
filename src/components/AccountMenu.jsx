import { LogOut, Settings, User } from "lucide-react";

export default function AccountMenu({
  avatarUrl,
  initials,
  displayName,
  email,
  roleName,
  onProfile,
  onSettings,
  onLogout,
}) {
  return (
    <div className="account-menu" role="menu">
      <div className="account-menu-header">
        <div className="account-menu-avatar">
          {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{initials}</span>}
        </div>
        <div className="account-menu-info">
          <p className="account-menu-name">{displayName}</p>
          <p className="account-menu-email">{email || "Signed-in account"}</p>
          <span className="account-menu-role">{roleName}</span>
        </div>
      </div>
      <button type="button" className="account-menu-item" role="menuitem" onClick={onProfile}>
        <User size={14} /> My Profile
      </button>
      {onSettings && (
        <button type="button" className="account-menu-item" role="menuitem" onClick={onSettings}>
          <Settings size={14} /> Settings
        </button>
      )}
      <button type="button" className="account-menu-item account-menu-item--danger" role="menuitem" onClick={onLogout}>
        <LogOut size={14} /> Logout
      </button>
    </div>
  );
}
