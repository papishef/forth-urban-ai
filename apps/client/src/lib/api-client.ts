import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:4000/api";

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
// Unlike the access token, this nonce is not an authentication credential. It
// is persisted solely so a full browser navigation can bootstrap the refresh
// cookie again without weakening the CSRF check on /auth/refresh.
const CSRF_STORAGE_KEY = "forth-urban.csrf-token";

function readStoredCsrfToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CSRF_STORAGE_KEY);
  } catch {
    return null;
  }
}

let csrfTokenMemory: string | null = readStoredCsrfToken();

// Always prefer the persisted copy: another tab may have rotated the token
// (each /auth/refresh issues a new one), and a stale in-memory value would
// make this tab's next refresh fail the CSRF check and log the user out.
function currentCsrfToken(): string | null {
  return readStoredCsrfToken() ?? csrfTokenMemory;
}

export function setCsrfToken(token: string | null): void {
  csrfTokenMemory = token;
  if (typeof window === "undefined") return;

  try {
    if (token) {
      window.localStorage.setItem(CSRF_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(CSRF_STORAGE_KEY);
    }
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts; the
    // in-memory value still keeps SPA navigation working in that case.
  }
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

let onAdminAccessDenied: (() => void) | null = null;

export function setAdminAccessDeniedHandler(handler: (() => void) | null): void {
  onAdminAccessDenied = handler;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const csrfToken = currentCsrfToken();
  if (csrfToken && ["POST", "PATCH", "PUT", "DELETE"].includes((init.method ?? "GET").toUpperCase())) {
    headers.set("x-csrf-token", csrfToken);
  }
  return fetch(`${API_BASE_URL}${path}`, { ...init, headers, credentials: "include" });
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  const csrfToken = currentCsrfToken();
  if (csrfToken && config.method && ["post", "patch", "put", "delete"].includes(config.method)) {
    config.headers.set("x-csrf-token", csrfToken);
  }
  return config;
});

// Endpoints where a 401 means "bad credentials", not "expired session" —
// retrying these via refresh would be pointless/looping.
const NO_RETRY_PATTERN = /\/auth\/(login|register|refresh|otp)/;

const REFRESH_LOCK_NAME = "forth-urban.auth-refresh";

interface RefreshEnvelope<T> {
  data: T | null;
}

interface RefreshedSession {
  tokens: { accessToken: string; csrfToken: string };
}

/**
 * Runs `task` while holding a browser-wide lock so only one tab rotates the
 * refresh token at a time. Refresh tokens are single-use: two tabs refreshing
 * with the same cookie concurrently would revoke each other's session.
 */
function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  if (!locks?.request) return task();
  return locks.request(REFRESH_LOCK_NAME, task) as Promise<T>;
}

interface RefreshOutcome<T> {
  data: T | null;
  /** True only when the server definitively rejected the session (401/403). */
  expired: boolean;
}

let refreshSessionPromise: Promise<RefreshOutcome<unknown>> | null = null;

function runRefresh<T extends RefreshedSession>(): Promise<RefreshOutcome<T>> {
  refreshSessionPromise ??= withRefreshLock(async (): Promise<RefreshOutcome<unknown>> => {
    try {
      const csrfToken = currentCsrfToken();
      const res = await axios.post<RefreshEnvelope<T>>(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true, headers: csrfToken ? { "x-csrf-token": csrfToken } : {} },
      );
      const data = res.data?.data ?? null;
      setAccessToken(data?.tokens.accessToken ?? null);
      if (data?.tokens.csrfToken) setCsrfToken(data.tokens.csrfToken);
      return { data, expired: !data };
    } catch (error) {
      setAccessToken(null);
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const expired = status === 401 || status === 403;
      if (expired) setCsrfToken(null);
      return { data: null, expired };
    }
  }).finally(() => {
    refreshSessionPromise = null;
  });

  return refreshSessionPromise as Promise<RefreshOutcome<T>>;
}

/**
 * Exchanges the httpOnly refresh cookie for a new access token, sliding the
 * 30-day session forward. Returns null when no session could be restored.
 * Only a definitive 401/403 clears the stored CSRF token — a flaky mobile
 * connection must not log the user out.
 */
export async function refreshSession<T extends RefreshedSession>(): Promise<T | null> {
  return (await runRefresh<T>()).data;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status !== 401 || !originalRequest) {
      if (error.response?.status === 403 && /\/admin\//.test(originalRequest?.url ?? "")) {
        onAdminAccessDenied?.();
      }
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
    const { data, expired } = await runRefresh();
    const newToken = data?.tokens.accessToken ?? null;
    if (!newToken) {
      if (expired) onSessionExpired?.();
      return Promise.reject(error);
    }

    originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
    return apiClient(originalRequest);
  },
);
