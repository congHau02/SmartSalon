import axios from "axios";
import { tokenStorage } from "../lib/tokenStorage";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Queue handling for concurrent requests while refreshing
/**
 * Create a single-flight token refresh coordinator.
 */
export function createSingleFlightRefresher(refreshFn) {
  let isRefreshing = false;
  let failedQueue = [];

  const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    failedQueue = [];
  };

  const refreshAccessToken = async () => {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      });
    }

    isRefreshing = true;

    try {
      const newToken = await refreshFn();
      processQueue(null, newToken);
      return newToken;
    } catch (err) {
      processQueue(err, null);
      throw err;
    } finally {
      isRefreshing = false;
    }
  };

  return {
    refreshAccessToken,
    isRefreshing: () => isRefreshing,
  };
}

export const isAuthEndpoint = (url) => {
  if (!url) return false;
  try {
    const parsed = new URL(url, "http://localhost");
    const pathname = parsed.pathname.replace(/\/+$/, "");
    return (
      pathname.endsWith("/auth/login") ||
      pathname.endsWith("/auth/refresh") ||
      pathname.endsWith("/auth/register")
    );
  } catch {
    const clean = url.split("?")[0].replace(/\/+$/, "");
    return (
      clean.endsWith("/auth/login") ||
      clean.endsWith("/auth/refresh") ||
      clean.endsWith("/auth/register")
    );
  }
};

const singleFlightManager = createSingleFlightRefresher(async () => {
  const currentRefresh = tokenStorage.getRefreshToken();
  if (!currentRefresh) {
    throw new Error("No refresh token available");
  }

  const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {
    refreshToken: currentRefresh,
  });

  const authResult = refreshResponse.data?.result;
  if (!authResult?.accessToken) {
    throw new Error("Không nhận được token mới từ máy chủ");
  }

  const newAccessToken = authResult.accessToken;
  const newRefreshToken = authResult.refreshToken;

  tokenStorage.setTokens(newAccessToken, newRefreshToken, authResult.user);
  return newAccessToken;
});

/**
 * Shared single-flight access token refresher coordinating both 401 interceptor
 * retries and explicit AuthContext refresh calls without Redis token rotation collisions.
 */
export async function refreshAccessToken() {
  const currentRefresh = tokenStorage.getRefreshToken();
  if (!currentRefresh) {
    tokenStorage.clearTokens();
    return Promise.reject(new Error("No refresh token available"));
  }

  try {
    return await singleFlightManager.refreshAccessToken();
  } catch (refreshErr) {
    tokenStorage.clearTokens();
    return Promise.reject(refreshErr);
  }
}

// Request interceptor: attach bearer token
axiosClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: auto silent refresh on 401
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      return Promise.reject({
        code: 9998,
        message: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng.",
      });
    }

    const { status, data } = error.response;

    // Handle 401 Unauthorized
    if (status === 401 && !originalRequest._retry) {
      if (isAuthEndpoint(originalRequest.url)) {
        return Promise.reject(data || error);
      }

      originalRequest._retry = true;
      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshErr) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth:logout"));
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login";
          }
        }
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(data || error);
  }
);
