import { useRef, useState } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { useDismissOnOutside } from "../services/useDismissOnOutside.js";

function NotificationGroup({ title, items, onItemClick }) {
  return (
    <section className="notif-group">
      <h3 className="notif-group-title">{title}</h3>
      <div className="notif-group-list">
        {items.map((item) => {
          const itemTitle = item.title || "Notification";
          const itemBody = item.desc || (item.text && item.text !== itemTitle ? item.text : "");
          const isUnread = Boolean(item.unread ?? (item.is_read === false));
          const toneClass = item.type ? ` notif-item--${item.type}` : "";

          return (
            <button
              key={item.id}
              type="button"
              className={`notif-item${isUnread ? " is-unread" : ""}${toneClass}`}
              onClick={() => onItemClick?.(item)}
            >
              <span className="notif-item-top">
                <span className="notif-item-title">{itemTitle}</span>
                {isUnread && <span className="notif-item-dot" aria-label="Unread" />}
              </span>
              {itemBody && <span className="notif-item-desc">{itemBody}</span>}
              {item.time && <span className="notif-item-time">{item.time}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function NotificationMenu({
  notifications = [],
  unreadCount,
  open,
  onToggle,
  onClose,
  onMarkRead,
  onMarkAllRead,
  error = "",
  emptyHint = "Updates about your clearances and activity will appear here.",
  compact = false,
  panelTitle = "Notifications",
}) {
  const [filterTab, setFilterTab] = useState("All");
  const rootRef = useRef(null);
  useDismissOnOutside(open, () => onClose?.(), rootRef);

  const list = Array.isArray(notifications) ? notifications : [];
  const listUnreadCount = list.filter((item) => Boolean(item.unread ?? (item.is_read === false))).length;
  const badgeCount = typeof unreadCount === "number" ? Math.max(unreadCount, listUnreadCount) : listUnreadCount;

  const displayed = list.filter((item) => {
    if (filterTab !== "Unread") return true;
    return Boolean(item.unread ?? (item.is_read === false));
  });

  const hasGroups = displayed.some((item) => item.group === "TODAY" || item.group === "EARLIER");
  const todayList = hasGroups ? displayed.filter((item) => item.group === "TODAY") : displayed;
  const earlierList = hasGroups ? displayed.filter((item) => item.group !== "TODAY") : [];

  const handleToggle = () => {
    setFilterTab("All");
    onToggle?.();
  };

  return (
    <div className="notif-root" ref={rootRef}>
      <button
        type="button"
        className={`notif-trigger${compact ? " notif-trigger--compact" : ""}${open ? " is-open" : ""}`}
        data-notification-toggle=""
        aria-label={`Notifications${badgeCount > 0 ? `, ${badgeCount} unread` : ""}`}
        aria-expanded={open}
        onClick={handleToggle}
      >
        <Bell size={compact ? 18 : 20} strokeWidth={1.85} aria-hidden="true" />
        {badgeCount > 0 && (
          <span className="notif-badge">{badgeCount > 99 ? "99+" : badgeCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel" role="dialog" aria-label={panelTitle}>
          <div className="notif-panel-head">
            <div className="notif-panel-title-row">
              <div className="notif-panel-heading">
                <h2>{panelTitle}</h2>
                {badgeCount > 0 && (
                  <span className="notif-unread-pill">{badgeCount} unread</span>
                )}
              </div>
              <button
                type="button"
                className="notif-close-btn"
                aria-label="Close notifications"
                onClick={() => onClose?.()}
              >
                <X size={15} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>

            <div className="notif-panel-toolbar">
              <div className="notif-tabs" role="tablist" aria-label="Filter notifications">
                {[
                  { id: "All", label: `All (${list.length})` },
                  { id: "Unread", label: `Unread (${listUnreadCount})` },
                ].map((tab) => {
                  const active = filterTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={`notif-tab${active ? " is-active" : ""}`}
                      onClick={() => setFilterTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {badgeCount > 0 && (
                <button
                  type="button"
                  className="notif-mark-all-btn"
                  onClick={() => onMarkAllRead?.()}
                >
                  <CheckCheck size={14} strokeWidth={2} aria-hidden="true" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          <div className="notif-panel-body">
            {error && (
              <div className="notif-error" role="alert">
                {error}
              </div>
            )}

            {displayed.length === 0 ? (
              !error && (
                <div className="notif-empty">
                  <strong>{filterTab === "Unread" ? "No unread notifications" : "No notifications yet"}</strong>
                  <p>{emptyHint}</p>
                </div>
              )
            ) : (
              <>
                {todayList.length > 0 && (
                  <NotificationGroup
                    title={hasGroups ? "TODAY" : "RECENT"}
                    items={todayList}
                    onItemClick={(item) => onMarkRead?.(item.id)}
                  />
                )}
                {earlierList.length > 0 && (
                  <NotificationGroup
                    title="EARLIER"
                    items={earlierList}
                    onItemClick={(item) => onMarkRead?.(item.id)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
