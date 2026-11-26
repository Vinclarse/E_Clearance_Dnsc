import apiClient from "./api.js";

function unwrap(response) {
  const body = response?.data;
  if (body && typeof body === "object" && "status_code" in body && "data" in body) {
    return body.data;
  }
  return body;
}

export async function getEmailChangeStatus() {
  const response = await apiClient.get("email-change/status/", { fresh: true });
  const data = unwrap(response);
  if (!data || typeof data !== "object" || !data.stage) return null;
  if (data.stage === "completed" || data.stage === "cancelled") return null;
  return data;
}

export async function requestEmailChange() {
  const response = await apiClient.post("email-change/request/", {});
  return unwrap(response);
}

export async function verifyEmailChangeCode(code) {
  const response = await apiClient.post("email-change/verify/", { code: String(code).trim() });
  return unwrap(response);
}

export async function setNewEmailAddress(changeToken, newEmail) {
  const response = await apiClient.post("email-change/set-new/", {
    change_token: changeToken,
    new_email: String(newEmail).trim(),
  });
  return unwrap(response);
}

export async function resendEmailChangeLink() {
  const response = await apiClient.post("email-change/resend/", {});
  return unwrap(response);
}

export async function cancelEmailChange() {
  const response = await apiClient.delete("email-change/status/");
  return unwrap(response);
}
