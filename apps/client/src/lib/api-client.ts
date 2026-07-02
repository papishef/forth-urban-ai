import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:4000/api";

// Access token lives in memory only (never localStorage) — refreshed silently
// via the httpOnly refresh-token cookie. This limits XSS blast radius.
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

function readCsrfCookie(): string | null {
  const match = /(?:^|; )csrfToken=([^;]*)/.exec(document.cookie);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  const csrfToken = readCsrfCookie();
  if (csrfToken && config.method && ["post", "patch", "put", "delete"].includes(config.method)) {
    config.headers.set("x-csrf-token", csrfToken);
  }
  return config;
});

// Endpoints where a 401 means "bad credentials", not "expired session" —
// retrying these via refresh would be pointless/looping.
const NO_RETRY_PATTERN = /\/auth\/(login|register|refresh|otp)/;

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const csrfToken = readCsrfCookie();
    const res = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true, headers: csrfToken ? { "x-csrf-token": csrfToken } : {} },
    );
    const token = (res.data?.data?.tokens?.accessToken as string | undefined) ?? null;
    setAccessToken(token);
    return token;
  } catch {
    setAccessToken(null);
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    const shouldRetry =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !NO_RETRY_PATTERN.test(originalRequest.url ?? "");

    if (!shouldRetry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });

    const newToken = await refreshPromise;
    if (!newToken) {
      return Promise.reject(error);
    }

    originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
    return apiClient(originalRequest);
  },
);
