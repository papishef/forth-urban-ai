import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../../middleware/error-handler.js";
import { env } from "../../config/env.js";

const CSRF_COOKIE_NAME = "csrfToken";
const CSRF_HEADER_NAME = "x-csrf-token";

/** Issues a fresh double-submit CSRF token cookie (readable by JS, not httpOnly by design). */
export function issueCsrfCookie(res: Response): void {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    domain: env.NODE_ENV === "production" ? env.COOKIE_DOMAIN : undefined,
    path: "/",
  });
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
