import apiClient from "./api";

function payloadOf(response) {
  const body = response?.data;
  if (body && typeof body === "object" && body.data && typeof body.data === "object") {
    return body.data;
  }
  return body ?? {};
}

export async function requestPasswordReset(email) {
  const response = await apiClient.post("password-reset/request/", { email });
  const data = payloadOf(response);
  return {
    detail:
      typeof data.detail === "string"
        ? data.detail
        : "If that email is registered and validated, a code has been sent.",
  };
}

export async function verifyPasswordReset(email, code) {
  const response = await apiClient.post("password-reset/verify/", { email, code });
  const data = payloadOf(response);
  if (typeof data.change_token !== "string" || !data.change_token) {
    throw new Error("The API did not return a password reset token. Request a new code.");
  }
  return { changeToken: data.change_token };
}

export async function completePasswordReset(changeToken, newPassword) {
  const response = await apiClient.post("password-reset/change/", {
    change_token: changeToken,
    new_password: newPassword,
  });
  const data = payloadOf(response);
  return {
    detail: typeof data.detail === "string" ? data.detail : "Password updated successfully.",
  };
}
