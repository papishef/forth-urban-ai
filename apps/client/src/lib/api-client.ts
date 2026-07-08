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

// The CSRF cookie is intentionally non-httpOnly so same-site deployments can
// read it via document.cookie — but this app's client (Vercel) and API
// (Render) are on unrelated domains, so a cookie set by the API response is
// never visible to document.cookie run on the client's origin. The server
// mirrors the token in the auth response body instead; store that copy here.
let csrfToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

// Lets AuthProvider react when a request definitively fails auth (session
// expired/invalid, refresh didn't help) so it can clear `user` state and let
// ProtectedRoute redirect to /login — otherwise `isAuthenticated` stays true
// forever after the initial login, and a later-expired session just leaves
// protected pages rendered with failed/empty queries instead of redirecting.
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
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
    const res = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true, headers: csrfToken ? { "x-csrf-token": csrfToken } : {} },
    );
    const token = (res.data?.data?.tokens?.accessToken as string | undefined) ?? null;
    const newCsrfToken = (res.data?.data?.tokens?.csrfToken as string | undefined) ?? null;
    setAccessToken(token);
    setCsrfToken(newCsrfToken);
    return token;
  } catch {
    setAccessToken(null);
    setCsrfToken(null);
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Bad-credentials endpoints (login/register/refresh/otp) — retrying via
    // refresh would be pointless/looping, and this isn't a "session expired
    // while browsing" case (no session existed yet), so don't notify.
    if (NO_RETRY_PATTERN.test(originalRequest.url ?? "")) {
      return Promise.reject(error);
    }

    // Already retried once via a refreshed token and still 401 — the
    // session is truly invalid (not just a stale access token).
    if (originalRequest._retry) {
      onSessionExpired?.();
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });

    const newToken = await refreshPromise;
    if (!newToken) {
      onSessionExpired?.();
      return Promise.reject(error);
    }

    originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
    return apiClient(originalRequest);
  },
);
