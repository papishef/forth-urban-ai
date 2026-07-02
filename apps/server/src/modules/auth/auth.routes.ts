import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  registerSchema,
  loginSchema,
  otpRequestSchema,
  otpVerifySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@forth-urban/validation";
import type { ApiEnvelope } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth } from "./auth.middleware.js";
import { requireCsrf, issueCsrfCookie } from "./csrf.middleware.js";
import { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE_NAME } from "./cookies.js";
import { passport } from "./passport.js";
import { env } from "../../config/env.js";
import * as authService from "./auth.service.js";
import type { UserDocument } from "../users/user.model.js";

export const authRouter: Router = Router();

// Auth endpoints are the primary abuse target (credential stuffing, OTP
// brute-force) — a tighter limiter than the global one applies here.
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
authRouter.use(authRateLimit);

function requestMeta(req: { ip?: string; headers: Record<string, unknown>; get?: (name: string) => string | undefined }) {
  return {
    ip: req.ip ?? null,
    userAgent: (req.get ? req.get("user-agent") : undefined) ?? null,
  };
}

authRouter.post("/register", validateBody(registerSchema), async (req, res, next) => {
  try {
    const { authResponse, refreshToken } = await authService.register(req.body, requestMeta(req));
    setRefreshCookie(res, refreshToken);
    issueCsrfCookie(res);

    const body: ApiEnvelope = { success: true, message: "Account created", data: authResponse, errors: null };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { authResponse, refreshToken } = await authService.login(req.body, requestMeta(req));
    setRefreshCookie(res, refreshToken);
    issueCsrfCookie(res);

    const body: ApiEnvelope = { success: true, message: "Logged in", data: authResponse, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/otp/request", validateBody(otpRequestSchema), async (req, res, next) => {
  try {
    await authService.requestOtp(req.body.email);
    const body: ApiEnvelope = { success: true, message: "Verification code sent", data: null, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/otp/verify", validateBody(otpVerifySchema), async (req, res, next) => {
  try {
    const { authResponse, refreshToken } = await authService.verifyOtp(req.body.email, req.body.code, requestMeta(req));
    setRefreshCookie(res, refreshToken);
    issueCsrfCookie(res);

    const body: ApiEnvelope = { success: true, message: "Verified", data: authResponse, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/refresh", requireCsrf, async (req, res, next) => {
  try {
    const { authResponse, refreshToken } = await authService.refresh(req.cookies?.[REFRESH_COOKIE_NAME], requestMeta(req));
    setRefreshCookie(res, refreshToken);
    issueCsrfCookie(res);

    const body: ApiEnvelope = { success: true, message: "Session refreshed", data: authResponse, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", requireCsrf, async (req, res, next) => {
  try {
    await authService.logout(req.cookies?.[REFRESH_COOKIE_NAME], req.auth?.sub ?? null, requestMeta(req));
    clearRefreshCookie(res);
    const body: ApiEnvelope = { success: true, message: "Logged out", data: null, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/password/forgot", validateBody(forgotPasswordSchema), async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    // Always the same response, whether or not the account exists (no user enumeration).
    const body: ApiEnvelope = {
      success: true,
      message: "If an account exists for this email, a reset link has been sent",
      data: null,
      errors: null,
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/password/reset", validateBody(resetPasswordSchema), async (req, res, next) => {
  try {
    const { email, token, password } = req.body;
    await authService.resetPassword(email, token, password);
    const body: ApiEnvelope = { success: true, message: "Password updated", data: null, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// Guards the two routes below: if GOOGLE_CLIENT_ID/SECRET aren't configured,
// passport.js has no "google" strategy registered and calling
// passport.authenticate("google", ...) would throw synchronously. Fail with
// a clean 503 instead.
function requireGoogleStrategy(req: unknown, res: import("express").Response, next: import("express").NextFunction) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    const body: ApiEnvelope = {
      success: false,
      message: "Google sign-in is not configured on this server",
      data: null,
      errors: null,
    };
    res.status(503).json(body);
    return;
  }
  next();
}

authRouter.get(
  "/google",
  requireGoogleStrategy,
  passport.authenticate("google", { scope: ["profile", "email"], session: false }),
);

authRouter.get(
  "/google/callback",
  requireGoogleStrategy,
  passport.authenticate("google", { session: false, failureRedirect: `${env.CLIENT_URL}/login?error=google` }),
  async (req, res, next) => {
    try {
      const user = req.user as UserDocument;
      const { refreshToken } = await authService.issueGoogleSession(user, requestMeta(req));
      setRefreshCookie(res, refreshToken);
      issueCsrfCookie(res);
      res.redirect(`${env.CLIENT_URL}/auth/google/success`);
    } catch (err) {
      next(err);
    }
  },
);

authRouter.get("/me", requireAuth, (req, res) => {
  const body: ApiEnvelope = { success: true, message: "OK", data: req.auth, errors: null };
  res.json(body);
});
