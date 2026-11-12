import apiClient from "./api";

export function signOut() {
  const refresh = localStorage.getItem("auth_refresh_token");

  const clearLocalSession = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_refresh_token");
    sessionStorage.setItem("signed-out", "true");
    window.location.assign("/");
  };

  if (!refresh) {
    clearLocalSession();
    return;
  }

  apiClient.post("logout/", { refresh })
    .catch((error) => {
      console.error("Could not revoke the API refresh token during sign-out:", error);
    })
    .finally(clearLocalSession);
}
