import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../../middleware/error-handler.js";
import { verifyAccessToken } from "./jwt.util.js";

/**
 * Verifies the `Authorization: Bearer <accessToken>` header and attaches the
 * decoded payload to `req.auth`. Access tokens are short-lived and passed by
 * the client in memory (not cookies), so no CSRF concern here.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new ApiError(401, "Authentication required"));
    return;
  }

  try {
    req.auth = verifyAccessToken(header.slice("Bearer ".length));
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired access token"));
  }
}

/** Restricts a route to one or more roles. Must run after `requireAuth`. */
export function requireRole(...roles: Array<"user" | "admin" | "sales">) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      next(new ApiError(403, "Insufficient permissions"));
      return;
    }
    next();
  };
}
