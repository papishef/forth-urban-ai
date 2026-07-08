import type { Response } from "express";
import { env } from "../../config/env.js";

export const REFRESH_COOKIE_NAME = "refreshToken";

const REFRESH_TTL_MS = parseTtlToMs(env.JWT_REFRESH_TTL);

function parseTtlToMs(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) return 30 * 24 * 60 * 60 * 1000; // fallback: 30 days
  const value = Number(match[1]);
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2] as "s" | "m" | "h" | "d"];
  return value * unitMs;
}

export function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    // Client and API are cross-site (different registrable domains, e.g.
    // Vercel + Render), so SameSite=Lax silently drops this cookie on every
    // cross-origin fetch/XHR request \u2014 it only ever travels with top-level
    // GET navigations. SameSite=None (paired with Secure) is required for
    // the browser to send it back to the API at all. No Domain attribute:
    // COOKIE_DOMAIN only matters if client+API share a parent apex domain
    // (see docs/ENVIRONMENT.md); on unrelated domains it must be omitted so
    // the cookie defaults to the API's own host.
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/api/auth",
    maxAge: REFRESH_TTL_MS,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
}

export function refreshExpiresAt(): Date {
  return new Date(Date.now() + REFRESH_TTL_MS);
}
