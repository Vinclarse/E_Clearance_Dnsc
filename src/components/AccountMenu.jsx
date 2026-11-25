import { LogOut, User } from "lucide-react";
import "../styles/navigation.css";

export default function AccountMenu({
  avatarUrl,
  initials,
  displayName,
  email,
  roleName,
  onProfile,
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
      <button type="button" className="account-menu-item account-menu-item--danger" role="menuitem" onClick={onLogout}>
        <LogOut size={14} /> Logout
      </button>
    </div>
  );
}
