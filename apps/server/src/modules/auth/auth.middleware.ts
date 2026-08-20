import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@forth-urban/shared-types";
import { ApiError } from "../../middleware/error-handler.js";
import { User } from "../users/user.model.js";
import { consumeReauthToken } from "./reauth.service.js";
import { verifyAccessToken } from "./jwt.util.js";

/**
 * Verifies the `Authorization: Bearer <accessToken>` header and attaches the
 * decoded payload to `req.auth`. Access tokens are short-lived and passed by
 * the client in memory (not cookies), so no CSRF concern here.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new ApiError(401, "Authentication required"));
    return;
  }

  let tokenPayload;
  try {
    tokenPayload = verifyAccessToken(header.slice("Bearer ".length));
  } catch {
    next(new ApiError(401, "Invalid or expired access token"));
    return;
  }

  try {
    const user = await User.findById(tokenPayload.sub);
    if (!user) {
      next(new ApiError(401, "Account no longer exists"));
      return;
    }
    if (user.status === "suspended") {
      next(new ApiError(403, "This account has been suspended"));
      return;
    }

    req.auth = {
      ...tokenPayload,
      role: user.role as UserRole,
      email: user.email,
    };
    req.authUser = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Restricts a route to one or more roles. Must run after `requireAuth`. */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      next(new ApiError(403, "Insufficient permissions"));
      return;
    }
    next();
  };
}

export function requireReauth() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const token = req.headers["x-reauth-token"];
    if (typeof token !== "string" || !req.auth) {
      next(new ApiError(401, "A recent password confirmation is required"));
      return;
    }

    try {
      await consumeReauthToken(req.auth.sub, token);
      next();
    } catch (err) {
      next(err);
    }
  };
}
