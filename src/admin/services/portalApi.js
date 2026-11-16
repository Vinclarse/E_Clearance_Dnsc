import apiClient from "../../services/api.js";

export function unwrapEnvelope(response) {
  const body = response?.data;
  if (body && typeof body === "object" && "status_code" in body && "data" in body) {
    return body.data;
  }
  return body;
}

export function readPage(payload) {
  if (payload && Array.isArray(payload.data)) {
    return {
      items: payload.data,
      total: Number(payload.total_items ?? payload.data.length),
      pages: Number(payload.total_pages ?? 1),
      page: Number(payload.current_page ?? 1),
    };
  }
  if (Array.isArray(payload)) {
    return { items: payload, total: payload.length, pages: 1, page: 1 };
  }
  if (Array.isArray(payload?.results)) {
    return {
      items: payload.results,
      total: Number(payload.count ?? payload.results.length),
      pages: 1,
      page: 1,
    };
  }
  return { items: [], total: 0, pages: 1, page: 1 };
}

export function apiErrorMessage(error, fallback) {
  const errors = error?.response?.data?.errors;
  if (typeof errors?.detail === "string" && errors.detail.trim()) return errors.detail;
  if (errors && typeof errors === "object") {
    const text = Object.values(errors)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter((value) => typeof value === "string" && value.trim())
      .join(" ");
    if (text) return text;
  }
  const message = error?.response?.data?.message;
  if (typeof message === "string" && message.trim() && message !== "Error") return message;
  return fallback;
}

export async function fetchStudents(params) {
  const response = await apiClient.get("students/", { params });
  return readPage(unwrapEnvelope(response));
}

export async function fetchPrograms() {
  const response = await apiClient.get("programs/", { params: { per_page: 50, current_page: 1 } });
  return readPage(unwrapEnvelope(response)).items.map((program) => ({
    id: program.id,
    name: program.name,
    acronym: program.acronym || program.name,
  }));
}

export async function fetchRoles() {
  const response = await apiClient.get("access/roles/");
  const data = unwrapEnvelope(response);
  return Array.isArray(data) ? data : [];
}

export async function fetchUsers(params) {
  const response = await apiClient.get("users/", { params });
  return readPage(unwrapEnvelope(response));
}

export async function fetchUser(id) {
  const response = await apiClient.get(`users/${id}/`);
  return unwrapEnvelope(response);
}

export async function assignRoles(userId, roles) {
  const response = await apiClient.post("access/assign/", { user_id: userId, roles });
  return unwrapEnvelope(response);
}

export async function fetchAuditLogs(params) {
  const response = await apiClient.get("audit-logs/", { params });
  return readPage(unwrapEnvelope(response));
}

export async function fetchAuditLog(id) {
  const response = await apiClient.get(`audit-logs/${id}/`);
  return unwrapEnvelope(response);
}

export async function fetchAuditReport(params) {
  const response = await apiClient.get("audit-logs/report/", { params });
  return unwrapEnvelope(response);
}

export async function updateClearanceType(id, payload) {
  const response = await apiClient.patch(`clearance-types/${id}/`, payload);
  return unwrapEnvelope(response);
}

export async function issueClearanceType(id) {
  const response = await apiClient.post(`clearance-types/${id}/issue/`, {});
  return unwrapEnvelope(response);
}

export async function fetchItemTotal(params) {
  const response = await apiClient.get("student-clearance-items/", {
    params: { ...params, per_page: 1, current_page: 1 },
  });
  return readPage(unwrapEnvelope(response)).total;
}

export async function uploadStudentInvitations(file, { dryRun }) {
  const form = new FormData();
  form.append("file", file);
  form.append("dry_run", dryRun ? "true" : "false");
  form.append("skip_invalid", "true");
  const response = await apiClient.post("admin/student-bulk-invitations/upload/", form);
  return response.data;
}

async function blobErrorMessage(blob, fallback) {
  if (!blob || typeof blob.text !== "function") return fallback;
  const type = String(blob.type || "");
  if (!type.includes("json") && !type.includes("text")) return null;
  try {
    const parsed = JSON.parse(await blob.text());
    return parsed?.errors?.detail || (parsed?.message !== "Error" ? parsed?.message : fallback) || fallback;
  } catch {
    return type.includes("json") ? fallback : null;
  }
}

export async function downloadAdminFile(path, filename, params) {
  const response = await apiClient.get(path, { params, responseType: "blob" });
  const blob = response.data;
  const errorMessage = await blobErrorMessage(blob, "The file could not be downloaded.");
  if (errorMessage && String(blob?.type || "").includes("json")) {
    throw new Error(errorMessage);
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
