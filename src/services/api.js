import axios from "axios";

const baseURL = (
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.origin}/api/v1/`
).replace(/\/?$/, "/");

const apiClient = axios.create({
  baseURL,
});

let refreshRequest;
const readCache = new Map();

function requestUrl(config) {
  return String(config?.url || "");
}

function isAuthRequest(url = "") {
  return isPasswordResetRequest(url) || /(?:^|\/)(?:login|logout|auth\/google|token\/refresh)\/?$/.test(url);
}

function cacheKey(config) {
  const params = config?.params ? JSON.stringify(config.params) : "";
  return `${String(config?.method || "get").toLowerCase()} ${requestUrl(config)} ${params}`;
}

function canStoreRead(config) {
  const method = String(config?.method || "get").toLowerCase();
  if (method !== "get") return false;
  if (config?.responseType === "blob" || config?.responseType === "arraybuffer") return false;
  if (isAuthRequest(requestUrl(config))) return false;
  return true;
}

function readFromCache(config) {
  if (!canStoreRead(config) || config?.fresh) return null;
  return readCache.get(cacheKey(config)) || null;
}

function storeRead(config, response) {
  if (!canStoreRead(config) || config?._fromCache) return;
  readCache.set(cacheKey(config), {
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

function resourceName(url = "") {
  return String(url).replace(/^\//, "").split("?")[0].split("/")[0];
}

function dropCachedReads(url = "") {
  const resource = resourceName(url);
  if (!resource) {
    readCache.clear();
    return;
  }
  for (const key of readCache.keys()) {
    if (key.includes(` ${resource}`) || key.includes(`/${resource}`)) readCache.delete(key);
  }
}

export function clearReadCache() {
  readCache.clear();
}

// Password reset is public. Sending a saved access token makes the API
// reject the call with 401 before it reads the reset payload.
function isPasswordResetRequest(url = "") {
  return /(?:^|\/)password-reset\/(?:request|verify|change)\/?$/.test(url);
}

apiClient.interceptors.request.use((config) => {
  if (isPasswordResetRequest(config.url)) {
    config.headers?.delete?.("Authorization");
    if (config.headers) delete config.headers.Authorization;
    return config;
  }

  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const cached = readFromCache(config);
  if (cached) {
    config._fromCache = true;
    config.adapter = async () => ({
      data: cached.data,
      status: cached.status,
      statusText: cached.statusText,
      headers: cached.headers,
      config,
      request: {},
    });
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const config = response?.config;
    const method = String(config?.method || "get").toLowerCase();
    if (method === "get") storeRead(config, response);
    else if (config && response.status < 400) dropCachedReads(requestUrl(config));
    return response;
  },
  async (error) => {
    const request = error.config;
    const refreshToken = localStorage.getItem("auth_refresh_token");
    const isAuthEndpoint =
      isPasswordResetRequest(request?.url) ||
      /(?:^|\/)(?:login|logout|auth\/google|token\/refresh)\/?$/.test(request?.url ?? "");

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
