import axios from "axios";

const baseURL = (
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.origin}/api/v1/`
).replace(/\/?$/, "/");

const apiClient = axios.create({
  baseURL,
});

let refreshRequest;

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const refreshToken = localStorage.getItem("auth_refresh_token");
    const isAuthEndpoint = /(?:^|\/)(?:login|logout|auth\/google|token\/refresh)\/$/.test(
      request?.url ?? "",
    );

    if (
      error.response?.status !== 401 ||
      !request ||
      request._retry ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    request._retry = true;

    if (!refreshToken) {
      localStorage.removeItem("auth_token");
      if (window.location.pathname === "/dashboard") {
        window.location.replace("/login");
      }
      return Promise.reject(error);
    }

    try {
      refreshRequest ??= axios
        .post(`${baseURL}token/refresh/`, { refresh: refreshToken })
        .then((response) => {
          const tokens = response.data?.data ?? response.data;
          if (typeof tokens?.access !== "string" || !tokens.access) {
            throw new Error("The token refresh response did not include an access token.");
          }

          localStorage.setItem("auth_token", tokens.access);
          if (typeof tokens.refresh === "string" && tokens.refresh) {
            localStorage.setItem("auth_refresh_token", tokens.refresh);
          }
          return tokens.access;
        })
        .finally(() => {
          refreshRequest = undefined;
        });

      const accessToken = await refreshRequest;
      request.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(request);
    } catch (refreshError) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_refresh_token");
      if (window.location.pathname === "/dashboard") {
        window.location.replace("/login");
      }
      return Promise.reject(refreshError);
    }
  },
);

export default apiClient;
