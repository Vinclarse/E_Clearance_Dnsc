import apiClient from "../../services/api.js";
import { displayApiText, formatAcademicYear } from "../../services/clearanceDisplay.js";
import { readPage } from "./portalApi.js";

function unwrap(response) {
  const body = response?.data;
  if (body && typeof body === "object" && "status_code" in body && "data" in body) {
    return body.data;
  }
  return body;
}

function ordinal(level) {
  const names = { 1: "1st", 2: "2nd", 3: "3rd" };
  return names[level] || `${level}th`;
}

export function formatYearLevels(levels) {
  if (!Array.isArray(levels) || levels.length === 0) return "—";
  const sorted = [...levels].map(Number).filter((level) => Number.isFinite(level)).sort((a, b) => a - b);
  if (sorted.length === 0) return "—";
  if (sorted.length === 1) return `${ordinal(sorted[0])} Year`;
  const contiguous = sorted.every((level, index) => index === 0 || level === sorted[index - 1] + 1);
  if (contiguous) return `${ordinal(sorted[0])} to ${ordinal(sorted.at(-1))} Year`;
  return sorted.map((level) => `${ordinal(level)} Year`).join(", ");
}

export function formatIssuedOn(value) {
  if (!value) return "Not issued";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function pickClearanceType(types) {
  if (!Array.isArray(types) || types.length === 0) return null;
  return (
    types.find((type) => type.is_active && type.is_issued) ||
    types.find((type) => type.is_issued) ||
    types.find((type) => type.is_active) ||
    types[0]
  );
}

export function apiErrorMessage(error, fallback) {
  const errors = error?.response?.data?.errors;
  if (typeof errors?.detail === "string" && errors.detail.trim()) return errors.detail;
  const message = error?.response?.data?.message;
  if (typeof message === "string" && message.trim() && message !== "Error") return message;
  return fallback;
}

export async function fetchAdminSummary() {
  const response = await apiClient.get("clearance-types/admin-summary/");
  return unwrap(response);
}

export async function fetchClearanceTypes() {
  const response = await apiClient.get("clearance-types/", { params: { per_page: 50, current_page: 1 } });
  return readPage(unwrap(response), 50).items;
}

export async function fetchClearanceTypeDashboard(id) {
  const response = await apiClient.get(`clearance-types/${id}/dashboard/`);
  return unwrap(response);
}

export async function fetchUnreadCount() {
  const response = await apiClient.get("notifications/unread-count/");
  const data = unwrap(response);
  return Number(data?.unread_count ?? 0);
}

export async function fetchCurrentAdmin(config) {
  const response = await apiClient.get("me/", config);
  const data = unwrap(response);
  return Array.isArray(data) ? data[0] : data;
}

async function fetchItemsByStatus(status) {
  const items = [];
  let page = 1;
  let pages = 1;
  let total = 0;

  do {
    const response = await apiClient.get("student-clearance-items/", {
      params: { status, per_page: 100, current_page: page },
    });
    const parsed = readPage(unwrap(response), 100);
    total = parsed.total;
    pages = parsed.pages || 1;
    items.push(...parsed.items);
    page += 1;
  } while (page <= pages && page <= 20);

  return { items, total };
}

export async function fetchOfficeBacklog() {
  const [pending, issues] = await Promise.all([
    fetchItemsByStatus("pending"),
    fetchItemsByStatus("has_issue"),
  ]);
  const offices = new Map();

  function add(item, field) {
    const office =
      displayApiText(item?.authorizing_role_name) ||
      displayApiText(item?.requirement_name) ||
      "Office";
    const row = offices.get(office) ?? { office, pending: 0, deficiency: 0, total: 0 };
    row[field] += 1;
    row.total += 1;
    offices.set(office, row);
  }

  pending.items.forEach((item) => add(item, "pending"));
  issues.items.forEach((item) => add(item, "deficiency"));

  const rows = [...offices.values()].sort((a, b) => b.total - a.total);
  if (rows[0]?.total > 0) rows[0].highest = true;

  return {
    rows,
    pendingTotal: pending.total,
    issueTotal: issues.total,
  };
}

export function presentTerm(type, dashboard) {
  const clearance = dashboard?.clearance_type ?? type ?? {};
  const requirements = Array.isArray(clearance.requirements)
    ? clearance.requirements
    : Array.isArray(dashboard?.requirements)
      ? dashboard.requirements
      : [];
  const stats = dashboard?.stats ?? {};
  const issuedCount = Number(stats.issued_students_count ?? 0);

  return {
    title: displayApiText(clearance.name) || "Issued clearance",
    academicYear: formatAcademicYear(clearance.academic_year),
    semester: displayApiText(clearance.semester),
    open: Boolean(clearance.is_active),
    statusLabel: clearance.is_active ? "Clearance Open" : clearance.is_issued ? "Issued" : "Inactive",
    targetYearLevels: formatYearLevels(clearance.target_year_levels),
    issuedOn: formatIssuedOn(clearance.issued_at),
    studentsIssued: Number.isFinite(issuedCount) ? issuedCount : 0,
    signatoryOffices: requirements.length,
    chain: [...requirements]
      .sort((a, b) => Number(a.order_sequence ?? 0) - Number(b.order_sequence ?? 0))
      .map((requirement, index) => ({
        step: Number(requirement.order_sequence ?? index + 1),
        label: displayApiText(requirement.authorizing_role_name) || displayApiText(requirement.name) || "Office",
      })),
  };
}
