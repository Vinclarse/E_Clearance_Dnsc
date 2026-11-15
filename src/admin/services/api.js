/**
 * E-Clearance Admin Portal -- API Service Layer
 * Based on FRONTEND_INTEGRATION_GUIDE
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

function getToken() {
  return localStorage.getItem("auth_token") || "";
}

function buildHeaders(isJson = true) {
  const h = { Authorization: "Bearer " + getToken() };
  if (isJson) h["Content-Type"] = "application/json";
  return h;
}

async function request(path, options = {}) {
  const url = BASE_URL + path;
  try {
    const res = await fetch(url, {
      ...options,
      headers: { ...buildHeaders(options.isJson !== false), ...(options.headers || {}) },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || "HTTP " + res.status);
    }
    if (res.status === 204) return null;
    return res.json();
  } catch (err) {
    console.error("[API]", options.method || "GET", path, err);
    throw err;
  }
}

// AUTH
export async function login(email, password) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data?.token) localStorage.setItem("auth_token", data.token);
  if (data?.user) localStorage.setItem("admin_user", JSON.stringify(data.user));
  return data;
}

export async function logout() {
  await request("/auth/logout", { method: "POST" }).catch(() => {});
  localStorage.removeItem("auth_token");
  localStorage.removeItem("admin_user");
}

// DASHBOARD
export function getDashboardOverview(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request("/admin/analytics/overview" + (q ? "?" + q : ""));
}

export function getStatusDistribution(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request("/admin/analytics/status-distribution" + (q ? "?" + q : ""));
}

export function getBottleneckAnalysis(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request("/admin/analytics/bottleneck" + (q ? "?" + q : ""));
}

// CLEARANCE TEMPLATES
export function getTemplates() { return request("/admin/clearance-templates"); }
export function getTemplate(id) { return request("/admin/clearance-templates/" + id); }
export function createTemplate(data) {
  return request("/admin/clearance-templates", { method: "POST", body: JSON.stringify(data) });
}
export function updateTemplate(id, data) {
  return request("/admin/clearance-templates/" + id, { method: "PUT", body: JSON.stringify(data) });
}
export function issueClearance(templateId) {
  return request("/admin/clearance-templates/" + templateId + "/issue", { method: "POST" });
}
export function saveTemplateDraft(data) {
  return request("/admin/clearance-templates/draft", { method: "POST", body: JSON.stringify(data) });
}

// STUDENTS
export function getStudents(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request("/admin/students" + (q ? "?" + q : ""));
}
export function getStudent(id) { return request("/admin/students/" + id); }
export function getStudentProgress(studentId) {
  return request("/admin/students/" + studentId + "/clearance-progress");
}

// SIGNATORY ROLES
export function getSignatoryRoles() { return request("/admin/signatory-roles"); }
export function createSignatoryRole(data) {
  return request("/admin/signatory-roles", { method: "POST", body: JSON.stringify(data) });
}
export function updateSignatoryRole(id, data) {
  return request("/admin/signatory-roles/" + id, { method: "PUT", body: JSON.stringify(data) });
}
export function deleteSignatoryRole(id) {
  return request("/admin/signatory-roles/" + id, { method: "DELETE" });
}

// AUDIT LOGS
export function getAuditLogs(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request("/admin/audit-logs" + (q ? "?" + q : ""));
}

// PROFILE
export function getProfile() { return request("/admin/profile"); }
export function updateProfile(data) {
  return request("/admin/profile", { method: "PUT", body: JSON.stringify(data) });
}
export async function uploadAvatar(file) {
  const fd = new FormData();
  fd.append("avatar", file);
  const res = await fetch(BASE_URL + "/admin/profile/avatar", {
    method: "POST",
    headers: { Authorization: "Bearer " + getToken() },
    body: fd,
  });
  if (!res.ok) throw new Error("Avatar upload failed");
  return res.json();
}
export function changePassword(currentPassword, newPassword) {
  return request("/admin/profile/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// SETTINGS
export function getSettings() { return request("/admin/settings"); }
export function updateSettings(data) {
  return request("/admin/settings", { method: "PUT", body: JSON.stringify(data) });
}
export function getAcademicYears() { return request("/admin/academic-years"); }
export function createAcademicYear(data) {
  return request("/admin/academic-years", { method: "POST", body: JSON.stringify(data) });
}