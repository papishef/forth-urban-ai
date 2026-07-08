import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../../middleware/error-handler.js";
import { env } from "../../config/env.js";

const CSRF_COOKIE_NAME = "csrfToken";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Issues a fresh double-submit CSRF token cookie (readable by JS, not
 * httpOnly by design) and returns the raw token so the caller can also embed
 * it in the JSON response body. The client (Vercel) and API (Render) are on
 * unrelated domains, so frontend JS can never read this cookie cross-origin
 * via document.cookie — the response-body copy is the only way it reaches
 * the client in that deployment shape.
 */
export function issueCsrfCookie(res: Response): string {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: env.NODE_ENV === "production",
    // Client and API are cross-site (different registrable domains), so the
    // cookie must be SameSite=None to be sent back at all on cross-origin
    // requests — SameSite=Lax silently drops cookies on cross-site
    // fetch/XHR (it only allows top-level GET navigations).
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  return token;
}

/**
 * Double-submit CSRF protection for cookie-authenticated state-changing
 * routes (refresh, logout). Requires the header to match the cookie.
 */
export function requireCsrf(req: Request, _res: Response, next: NextFunction): void {
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    next(new ApiError(403, "Invalid or missing CSRF token"));
    return;
  }
  next();
}

export const CSRF_COOKIE = CSRF_COOKIE_NAME;
