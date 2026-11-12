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

  return items.map((item) => {
    const type = String(item.type ?? "").toLowerCase();
    const style = /issue|rejected/.test(type)
      ? "danger"
      : /cleared|completed|approved/.test(type)
        ? "success"
        : "info";
    const createdAt = new Date(item.created_at);

    return {
      id: item.id,
      text: [item.title, item.message_preview].filter(Boolean).join(": "),
      type: style,
      time: Number.isNaN(createdAt.getTime()) ? "" : createdAt.toLocaleString(),
      is_read: Boolean(item.is_read),
    };
  });
}

export function markAllNotificationsRead() {
  return apiClient.post("notifications/mark-all-read/");
}
