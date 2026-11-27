import apiClient from "./api";

export async function fetchNotifications() {
  const response = await apiClient.get("notifications/", {
    params: { per_page: 50 },
  });
  const payload = response.data?.data ?? response.data;
  const items = Array.isArray(payload)
    ? payload
    : payload?.results ?? payload?.items ?? payload?.data;

  if (!Array.isArray(items)) {
    throw new Error("The notifications API returned an unexpected response.");
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return items.map((item) => {
    const type = String(item.type ?? "").toLowerCase();
    const style = /issue|rejected|deficien/.test(type)
      ? "danger"
      : /cleared|completed|approved|valid/.test(type)
        ? "success"
        : "info";
    const createdAt = item.created_at ? new Date(item.created_at) : null;
    const validDate = createdAt && !Number.isNaN(createdAt.getTime());
    const title = item.title || "Notification";
    const desc = item.message_preview || "";
    const isRead = Boolean(item.is_read);

    return {
      id: item.id,
      title,
      desc,
      text: [item.title, item.message_preview].filter(Boolean).join(": "),
      type: style,
      time: validDate
        ? createdAt.toLocaleString("en-PH", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })
        : "",
      group: validDate && createdAt >= startOfToday ? "TODAY" : "EARLIER",
      is_read: isRead,
      unread: !isRead,
    };
  });
}

export function markNotificationRead(id) {
  return apiClient.get(`notifications/${id}/`);
}

export function markAllNotificationsRead() {
  return apiClient.post("notifications/mark-all-read/");
}
