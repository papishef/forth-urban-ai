/**
 * Auth module — Phase 1.
 *
 * Owns: register, login, JWT access/refresh issuance, email OTP via Resend,
 * Google OAuth (Passport), logout/session revocation, password reset.
 */
export { authRouter } from "./auth.routes.js";
export { requireAuth, requireRole } from "./auth.middleware.js";

