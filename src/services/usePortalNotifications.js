import { useEffect, useState } from "react";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notifications.js";
import { subscribePortalRefresh } from "./portalRefresh.js";

export function usePortalNotifications({ injectedAlert = null, onClearInjectedAlert = null } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [readInjectedAlertId, setReadInjectedAlertId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    function loadNotifications() {
      fetchNotifications()
        .then((items) => {
          if (!mounted) return;
          setNotifications(items);
          setError("");
        })
        .catch((err) => {
          if (!mounted) return;
          console.error("Failed to load notifications:", err);
          setError("Could not load notifications. Please try again.");
        });
    }
    loadNotifications();
    const stopRefresh = subscribePortalRefresh(loadNotifications);
    return () => {
      mounted = false;
      stopRefresh();
    };
  }, []);

  const normalizedInjected = injectedAlert
    ? {
        title: injectedAlert.title || "Update",
        desc: injectedAlert.desc || injectedAlert.text || "",
        group: "TODAY",
        ...injectedAlert,
        unread: injectedAlert.id !== readInjectedAlertId,
        is_read: injectedAlert.id === readInjectedAlertId,
      }
    : null;

  const items = normalizedInjected ? [normalizedInjected, ...notifications] : notifications;
  const unreadCount = items.filter((item) => Boolean(item.unread ?? (item.is_read === false))).length;

  const markRead = (id) => {
    if (normalizedInjected && id === normalizedInjected.id) {
      setReadInjectedAlertId(id);
      return;
    }
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, is_read: true, unread: false } : item,
      ),
    );
    markNotificationRead(id).catch(() => {});
  };

  const markAllRead = async () => {
    setError("");
    try {
      await markAllNotificationsRead();
      setNotifications((current) =>
        current.map((item) => ({ ...item, is_read: true, unread: false })),
      );
      setReadInjectedAlertId(injectedAlert?.id ?? null);
      onClearInjectedAlert?.();
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
      setError("Could not mark notifications as read. Please try again.");
    }
  };

  return {
    notifications: items,
    unreadCount,
    error,
    markRead,
    markAllRead,
  };
}
