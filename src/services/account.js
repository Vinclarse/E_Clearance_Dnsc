import apiClient from "./api";

export async function fetchCurrentUser() {
  const response = await apiClient.get("me/");
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
  "governors",
  "deans",
  "program chairs",
]);

function groupNames(profile) {
  return (Array.isArray(profile?.groups) ? profile.groups : [])
    .map((group) => String(group?.name ?? group).trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminAccount(profile) {
  if (!profile) return false;
  if (profile.is_superuser === true) return true;
  return groupNames(profile).some((name) => name.includes("clearance management"));
}

export function isSignatoryAccount(profile) {
  if (!profile || isAdminAccount(profile)) return false;
  const groups = groupNames(profile);
  return groups.includes("institute admins") || groups.some((name) => signatoryGroups.has(name));
}

export function accountKindFor(profile) {
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
  return "/dashboard";
}
