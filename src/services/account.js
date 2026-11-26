import apiClient from "./api";

export async function fetchCurrentUser(config) {
  const response = await apiClient.get("me/", config);
  const payload = response.data?.data ?? response.data;
  const profile = Array.isArray(payload) ? payload[0] ?? null : payload;
  if (!profile || typeof profile !== "object") {
    throw new Error("The API did not return the current account.");
  }
  return profile;
}

const signatoryGroups = new Set([
  "librarians",
  "cashiers",
  "advisers",
  "advisors",
  "governors",
  "deans",
  "program chairs",
]);

const adminGroups = new Set([
  "school admins",
  "institute admins",
  "clearance management system admins",
  "institute staffs",
  "institute staff",
]);

function groupNames(profile) {
  return (Array.isArray(profile?.groups) ? profile.groups : [])
    .map((group) => String(group?.name ?? group).trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperuserAccount(profile) {
  return profile?.is_superuser === true;
}

export function isAdminAccount(profile) {
  if (!profile || isSuperuserAccount(profile)) return false;
  return groupNames(profile).some((name) => adminGroups.has(name));
}

export function isSignatoryAccount(profile) {
  if (!profile || isSuperuserAccount(profile)) return false;
  return groupNames(profile).some((name) => signatoryGroups.has(name));
}

export function accountKindFor(profile) {
  if (isSuperuserAccount(profile)) return "unsupported";
  if (isAdminAccount(profile)) return "admin";
  if (isSignatoryAccount(profile)) return "signatory";
  return "student";
}

export function homePathForAccount(profile) {
  const requestedPath = new URLSearchParams(window.location.search).get("next");
  if (isAdminAccount(profile)) {
    return requestedPath === "/admin" || requestedPath?.startsWith("/admin/")
      ? requestedPath
      : "/admin";
  }
  if (isSignatoryAccount(profile)) return "/signatory";
  if (isSuperuserAccount(profile)) return "/login";
  return "/dashboard";
}
