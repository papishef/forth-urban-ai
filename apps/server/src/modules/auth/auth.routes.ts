import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  registerSchema,
  loginSchema,
  otpRequestSchema,
  otpVerifySchema,
  emailVerificationSchema,
  resendEmailVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyPasswordSchema,
  changePasswordSchema,
  googleRegistrationIntentSchema,
} from "@forth-urban/validation";
import type { ApiEnvelope } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth } from "./auth.middleware.js";
import { requireCsrf, issueCsrfCookie, clearCsrfCookie } from "./csrf.middleware.js";
import { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE_NAME } from "./cookies.js";
import { passport, GOOGLE_QUIZ_REQUIRED } from "./passport.js";
import { issueRegistrationQuizSession } from "./registration-guard.js";
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
  skip: () => env.NODE_ENV === "test",
});
authRouter.use(authRateLimit);

const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
});

// Quiz sessions are cheap to request but each one is single-use and has a
// minimum completion time, so this mainly caps token farming per IP.
const registrationQuizSessionRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
});

const emailVerificationResendRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
});

const emailVerificationAttemptRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
});

const otpRequestRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
});

const otpVerifyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
});

function requestMeta(req: { ip?: string; headers: Record<string, unknown>; get?: (name: string) => string | undefined }) {
  return {
    ip: req.ip ?? null,
    userAgent: (req.get ? req.get("user-agent") : undefined) ?? null,
  };
}

// Client and API are cross-site (different registrable domains), so frontend
// JS can never read the csrfToken cookie via document.cookie — embed the
// same token in the JSON body so the client can store and echo it back.
function withCsrfToken<T extends { tokens: { csrfToken: string } }>(authResponse: T, csrfToken: string): T {
  return { ...authResponse, tokens: { ...authResponse.tokens, csrfToken } };
}

// Issued when an anonymous visitor starts the Home-Readiness Quiz. Registration
// requires this server-signed token, so accounts can't be created without
// actually going through the quiz first.
authRouter.post("/registration/quiz-session", registrationQuizSessionRateLimit, (_req, res) => {
  const body: ApiEnvelope = {
    success: true,
    message: "Quiz session started",
    data: issueRegistrationQuizSession(),
    errors: null,
  };
  res.status(201).json(body);
});

authRouter.post(
  "/registration/google-intent",
  registrationRateLimit,
  validateBody(googleRegistrationIntentSchema),
  async (req, res, next) => {
    try {
      const intent = await authService.createGoogleRegistrationIntent(req.body, requestMeta(req));
      const body: ApiEnvelope = { success: true, message: "Registration intent created", data: intent, errors: null };
      res.status(201).json(body);
    } catch (err) {
      next(err);
    }
  },
);

authRouter.post("/register", registrationRateLimit, validateBody(registerSchema), async (req, res, next) => {
  try {
    const { pending } = await authService.register(req.body, requestMeta(req));
    const body: ApiEnvelope = {
      success: true,
      message: "Check your email to activate your account",
      data: pending,
      errors: null,
    };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

authRouter.post(
  "/email-verification/resend",
  emailVerificationResendRateLimit,
  validateBody(resendEmailVerificationSchema),
  async (req, res, next) => {
    try {
      await authService.resendEmailVerification(req.body.email);
      const body: ApiEnvelope = {
        success: true,
        message: "If an unverified account exists for this email, a confirmation link has been sent",
        data: null,
        errors: null,
      };
      res.json(body);
    } catch (err) {
      next(err);
    }
  },
);

authRouter.post(
  "/email-verification/verify",
  emailVerificationAttemptRateLimit,
  validateBody(emailVerificationSchema),
  async (req, res, next) => {
    try {
      const { authResponse, refreshToken } = await authService.verifyEmail(req.body, requestMeta(req));
      setRefreshCookie(res, refreshToken);
      const csrfToken = issueCsrfCookie(res);

      const body: ApiEnvelope = {
        success: true,
        message: "Email verified",
        data: withCsrfToken(authResponse, csrfToken),
        errors: null,
      };
      res.json(body);
    } catch (err) {
      next(err);
    }
  },
);

authRouter.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { authResponse, refreshToken } = await authService.login(req.body, requestMeta(req));
    setRefreshCookie(res, refreshToken);
    const csrfToken = issueCsrfCookie(res);

    const body: ApiEnvelope = { success: true, message: "Logged in", data: withCsrfToken(authResponse, csrfToken), errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/otp/request", otpRequestRateLimit, validateBody(otpRequestSchema), async (req, res, next) => {
  try {
    await authService.requestOtp(req.body.email);
    const body: ApiEnvelope = { success: true, message: "Verification code sent", data: null, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/otp/verify", otpVerifyRateLimit, validateBody(otpVerifySchema), async (req, res, next) => {
  try {
    const { authResponse, refreshToken } = await authService.verifyOtp(req.body.email, req.body.code, requestMeta(req));
    setRefreshCookie(res, refreshToken);
    const csrfToken = issueCsrfCookie(res);

    const body: ApiEnvelope = { success: true, message: "Verified", data: withCsrfToken(authResponse, csrfToken), errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/refresh", requireCsrf, async (req, res, next) => {
  try {
    const { authResponse, refreshToken } = await authService.refresh(req.cookies?.[REFRESH_COOKIE_NAME], requestMeta(req));
    setRefreshCookie(res, refreshToken);
    const csrfToken = issueCsrfCookie(res);

    const body: ApiEnvelope = { success: true, message: "Session refreshed", data: withCsrfToken(authResponse, csrfToken), errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", requireCsrf, async (req, res, next) => {
  try {
    await authService.logout(req.cookies?.[REFRESH_COOKIE_NAME], req.auth?.sub ?? null, requestMeta(req));
    clearRefreshCookie(res);
    clearCsrfCookie(res);
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

// Re-auth gate for sensitive in-app actions (e.g. changing another user's
// role/status from the admin Users tab) — confirms the caller still knows
// their own password before the calling code proceeds with the mutation.
authRouter.post("/password/verify", requireAuth, validateBody(verifyPasswordSchema), async (req, res, next) => {
  try {
    const reauthToken = await authService.verifyPassword(req.auth!.sub, req.body.password);
    const body: ApiEnvelope = { success: true, message: "Password verified", data: { reauthToken }, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/password/change", requireAuth, validateBody(changePasswordSchema), async (req, res, next) => {
  try {
    const { authResponse, refreshToken } = await authService.changePassword(req.auth!.sub, req.body, requestMeta(req));
    setRefreshCookie(res, refreshToken);
    const csrfToken = issueCsrfCookie(res);
    const body: ApiEnvelope = {
      success: true,
      message: "Password updated",
      data: withCsrfToken(authResponse, csrfToken),
      errors: null,
    };
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

authRouter.get("/google", requireGoogleStrategy, (req, res, next) => {
  // Optional registration intent (completed quiz) round-trips through the
  // OAuth `state` parameter; existing accounts can sign in without one.
  const intent = typeof req.query.intent === "string" ? req.query.intent.slice(0, 256) : undefined;
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    ...(intent ? { state: intent } : {}),
  })(req, res, next);
});

authRouter.get("/google/callback", requireGoogleStrategy, (req, res, next) => {
  passport.authenticate(
    "google",
    { session: false },
    async (err: unknown, user: UserDocument | false, info?: { reason?: string }) => {
      if (err) {
        next(err);
        return;
      }
      if (!user) {
        const error = info?.reason === GOOGLE_QUIZ_REQUIRED ? "quiz_required" : "google";
        res.redirect(`${env.CLIENT_URL}/${error === "quiz_required" ? "register" : "login"}?error=${error}`);
        return;
      }
      try {
        const { refreshToken } = await authService.issueGoogleSession(user, requestMeta(req));
        setRefreshCookie(res, refreshToken);
        const csrfToken = issueCsrfCookie(res);
        // Client and API are cross-site, so the client can't read the CSRF
        // cookie; hand it over in the URL fragment (never sent to servers or
        // logged in Referer headers) so its first /auth/refresh succeeds.
        res.redirect(`${env.CLIENT_URL}/auth/google/success#csrf=${encodeURIComponent(csrfToken)}`);
      } catch (callbackErr) {
        next(callbackErr);
      }
    },
  )(req, res, next);
});

authRouter.get("/me", requireAuth, (req, res) => {
  const body: ApiEnvelope = { success: true, message: "OK", data: req.auth, errors: null };
  res.json(body);
});
