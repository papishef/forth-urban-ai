import type {
  ChangePasswordInput,
  RegisterInput,
  LoginInput,
  EmailVerificationInput,
} from "@forth-urban/validation";
import type { AuthResponse } from "@forth-urban/shared-types";
import { ApiError } from "../../middleware/error-handler.js";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import { sendEmail, otpEmailHtml, emailVerificationEmailHtml, passwordResetEmailHtml } from "../../lib/email.service.js";
import { generateNumericCode, generateOpaqueToken, hashSecret, compareSecret } from "../../lib/crypto.util.js";
import { User, type UserDocument } from "../users/user.model.js";
import { toUserDTO } from "../users/user.mapper.js";
import { Session } from "./session.model.js";
import { Otp } from "./otp.model.js";
import { PasswordResetToken } from "./password-reset-token.model.js";
import { EmailVerificationToken } from "./email-verification-token.model.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken, getTokenExpiry } from "./jwt.util.js";
import { refreshExpiresAt } from "./cookies.js";
import { env } from "../../config/env.js";
import { issueReauthToken } from "./reauth.service.js";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const EMAIL_CONFIRMATION_REQUIRED_MESSAGE = "Please confirm your email before logging in";

interface RequestMeta {
  ip: string | null;
  userAgent: string | null;
}

interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

async function issueSession(user: UserDocument, meta: RequestMeta): Promise<IssuedTokens> {
  if (user.status === "suspended") throw new ApiError(403, "This account has been suspended");
  if (!user.emailVerified) throw new ApiError(403, EMAIL_CONFIRMATION_REQUIRED_MESSAGE);

  const session = await Session.create({
    userId: user._id,
    refreshTokenHash: "pending",
    userAgent: meta.userAgent,
    ip: meta.ip,
    expiresAt: refreshExpiresAt(),
  });

  const accessToken = signAccessToken({
    sub: user._id.toString(),
    role: user.role as "user" | "admin",
    email: user.email,
  });
  const refreshToken = signRefreshToken({ sub: user._id.toString(), sessionId: session._id.toString() });

  session.set("refreshTokenHash", await hashSecret(refreshToken));
  await session.save();

  return { accessToken, refreshToken };
}

async function issueEmailVerification(user: UserDocument, force: boolean): Promise<void> {
  const latest = await EmailVerificationToken.findOne({
    userId: user._id,
    consumedAt: null,
  }).sort({ createdAt: -1 });
  const latestCreatedAt = latest?.get("createdAt") as Date | undefined;
  const cooldownMs = env.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS * 1000;

  if (!force && latestCreatedAt && Date.now() - latestCreatedAt.getTime() < cooldownMs) return;

  await EmailVerificationToken.updateMany(
    { userId: user._id, consumedAt: null },
    { consumedAt: new Date() },
  );

  const token = generateOpaqueToken();
  await EmailVerificationToken.create({
    userId: user._id,
    tokenHash: await hashSecret(token),
    expiresAt: new Date(Date.now() + env.EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000),
  });

  const verificationUrl = `${env.CLIENT_URL}/verify-email?email=${encodeURIComponent(user.email)}&token=${token}`;
  await sendEmail({
    to: user.email,
    subject: "Confirm your Forth Urban email address",
    html: emailVerificationEmailHtml(verificationUrl),
  });
}

function toAuthResponse(user: UserDocument, tokens: IssuedTokens): AuthResponse {
  return {
    user: toUserDTO(user),
    tokens: {
      accessToken: tokens.accessToken,
      accessTokenExpiresAt: getTokenExpiry(tokens.accessToken),
      // Placeholder — the route handler overwrites this with the real,
      // freshly-issued CSRF token via withCsrfToken() before responding.
      csrfToken: "",
    },
  };
}

export async function register(input: RegisterInput, meta: RequestMeta) {
  const existing = await User.findOne({ email: input.email });
  if (existing) throw new ApiError(409, "An account with this email already exists");

  const passwordHash = await hashSecret(input.password);
  const user = await User.create({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    passwordHash,
    authProvider: "local",
    emailVerified: false,
  });

  await issueEmailVerification(user, true);

  await recordAuditLog({
    actorId: user._id.toString(),
    actorType: "user",
    action: "auth.register",
    targetType: "User",
    targetId: user._id.toString(),
    ipAddress: meta.ip,
  });

  return {
    pending: {
      email: user.email,
      requiresEmailVerification: true as const,
    },
  };
}

export async function login(input: LoginInput, meta: RequestMeta) {
  const user = await User.findOne({ email: input.email }).select("+passwordHash");
  if (!user || !user.passwordHash) {
    throw new ApiError(401, "Invalid email or password");
  }

  const valid = await compareSecret(input.password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.status === "suspended") {
    throw new ApiError(403, "This account has been suspended");
  }
  if (!user.emailVerified) {
    throw new ApiError(403, EMAIL_CONFIRMATION_REQUIRED_MESSAGE);
  }

  const tokens = await issueSession(user, meta);

  await recordAuditLog({
    actorId: user._id.toString(),
    actorType: "user",
    action: "auth.login",
    targetType: "User",
    targetId: user._id.toString(),
    ipAddress: meta.ip,
  });

  return { authResponse: toAuthResponse(user, tokens), refreshToken: tokens.refreshToken };
}

export async function resendEmailVerification(email: string): Promise<void> {
  const user = await User.findOne({ email });
  if (!user || user.emailVerified || user.authProvider !== "local") return;

  await issueEmailVerification(user, false);
}

export async function verifyEmail(input: EmailVerificationInput, meta: RequestMeta) {
  const user = await User.findOne({ email: input.email });
  if (!user || user.emailVerified) {
    throw new ApiError(400, "Invalid or expired verification link");
  }
  if (user.status === "suspended") {
    throw new ApiError(403, "This account has been suspended");
  }

  const candidates = await EmailVerificationToken.find({
    userId: user._id,
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  let matched: (typeof candidates)[number] | null = null;
  for (const candidate of candidates) {
    if (await compareSecret(input.token, candidate.tokenHash)) {
      matched = candidate;
      break;
    }
  }
  if (!matched) throw new ApiError(400, "Invalid or expired verification link");

  const now = new Date();
  const claimed = await EmailVerificationToken.findOneAndUpdate(
    { _id: matched._id, consumedAt: null },
    { $set: { consumedAt: now } },
    { new: true },
  );
  if (!claimed) throw new ApiError(400, "Invalid or expired verification link");

  await EmailVerificationToken.updateMany(
    { userId: user._id, consumedAt: null },
    { consumedAt: now },
  );

  user.set("emailVerified", true);
  await user.save();
  await Session.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: now });

  const tokens = await issueSession(user, meta);
  await recordAuditLog({
    actorId: user._id.toString(),
    actorType: "user",
    action: "auth.email_verified",
    targetType: "User",
    targetId: user._id.toString(),
    ipAddress: meta.ip,
  });

  return { authResponse: toAuthResponse(user, tokens), refreshToken: tokens.refreshToken };
}

/**
 * Re-authenticates the currently signed-in user with their password —
 * used to gate sensitive in-app actions (e.g. an admin changing another
 * user's role/status) behind a fresh password confirmation, independent
 * of whether their access token is still valid.
 */
export async function verifyPassword(userId: string, password: string): Promise<string> {
  return issueReauthToken(userId, password);
}

export async function changePassword(userId: string, input: ChangePasswordInput, meta: RequestMeta) {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw new ApiError(404, "User not found");
  if (!user.passwordHash) {
    throw new ApiError(400, "This account does not have a local password. Use password recovery to set one first.");
  }

  const valid = await compareSecret(input.currentPassword, user.passwordHash);
  if (!valid) throw new ApiError(401, "Incorrect current password");

  user.set("passwordHash", await hashSecret(input.newPassword));
  await user.save();
  await Session.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });

  const tokens = await issueSession(user, meta);
  await recordAuditLog({
    actorId: user._id.toString(),
    actorType: "user",
    action: "auth.password_changed",
    targetType: "User",
    targetId: user._id.toString(),
    ipAddress: meta.ip,
  });

  return { authResponse: toAuthResponse(user, tokens), refreshToken: tokens.refreshToken };
}

/** Requests an OTP for email verification or passwordless login (Resend email). */
export async function requestOtp(email: string): Promise<void> {
  const code = generateNumericCode(6);
  await Otp.create({
    email,
    codeHash: await hashSecret(code),
    purpose: "login",
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  await sendEmail({ to: email, subject: "Your Forth Urban verification code", html: otpEmailHtml(code) });
}

export async function verifyOtp(email: string, code: string, meta: RequestMeta) {
  const otp = await Otp.findOne({ email, purpose: "login", consumedAt: null }).sort({ createdAt: -1 });
  if (!otp || otp.expiresAt < new Date()) {
    throw new ApiError(400, "This code has expired. Request a new one.");
  }
  if (otp.attempts >= MAX_OTP_ATTEMPTS) {
    throw new ApiError(429, "Too many attempts. Request a new code.");
  }

  const valid = await compareSecret(code, otp.codeHash);
  if (!valid) {
    otp.set("attempts", otp.attempts + 1);
    await otp.save();
    throw new ApiError(400, "Incorrect code");
  }

  otp.set("consumedAt", new Date());
  await otp.save();

  let user = await User.findOne({ email });
  if (!user) {
    const [firstName, ...rest] = email.split("@")[0]!.split(/[._-]/);
    user = await User.create({
      firstName: firstName ?? "Forth",
      lastName: rest.join(" ") || "Urban User",
      email,
      authProvider: "local",
      emailVerified: true,
    });
  } else if (!user.emailVerified) {
    user.set("emailVerified", true);
    await user.save();
  }

  const tokens = await issueSession(user, meta);

  await recordAuditLog({
    actorId: user._id.toString(),
    actorType: "user",
    action: "auth.otp_verified",
    targetType: "User",
    targetId: user._id.toString(),
    ipAddress: meta.ip,
  });

  return { authResponse: toAuthResponse(user, tokens), refreshToken: tokens.refreshToken };
}

export async function refresh(refreshToken: string | undefined, meta: RequestMeta) {
  if (!refreshToken) throw new ApiError(401, "No refresh token provided");

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, "Invalid or expired session");
  }

  const session = await Session.findById(payload.sessionId);
  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw new ApiError(401, "Session expired or revoked");
  }

  const matches = await compareSecret(refreshToken, session.refreshTokenHash);
  if (!matches) {
    // Possible token reuse/theft — revoke the session defensively.
    session.set("revokedAt", new Date());
    await session.save();
    throw new ApiError(401, "Invalid session");
  }

  const user = await User.findById(session.userId);
  if (!user) throw new ApiError(401, "Account no longer exists");
  if (user.status === "suspended") {
    session.set("revokedAt", new Date());
    await session.save();
    throw new ApiError(403, "This account has been suspended");
  }
  if (!user.emailVerified) {
    session.set("revokedAt", new Date());
    await session.save();
    throw new ApiError(403, EMAIL_CONFIRMATION_REQUIRED_MESSAGE);
  }

  // Rotate: revoke this session's token and issue a brand new session.
  session.set("revokedAt", new Date());
  await session.save();

  const tokens = await issueSession(user, meta);

  return { authResponse: toAuthResponse(user, tokens), refreshToken: tokens.refreshToken };
}

export async function logout(refreshToken: string | undefined, actorId: string | null, meta: RequestMeta): Promise<void> {
  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await Session.findByIdAndUpdate(payload.sessionId, { revokedAt: new Date() });
    } catch {
      // Already invalid/expired — nothing to revoke.
    }
  }

  await recordAuditLog({
    actorId,
    actorType: "user",
    action: "auth.logout",
    ipAddress: meta.ip,
  });
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await User.findOne({ email });
  if (!user) return; // Don't reveal whether the account exists.

  const token = generateOpaqueToken();
  await PasswordResetToken.create({
    userId: user._id,
    tokenHash: await hashSecret(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  });

  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  await sendEmail({
    to: email,
    subject: "Reset your Forth Urban password",
    html: passwordResetEmailHtml(resetUrl),
  });
}

export async function resetPassword(email: string, token: string, newPassword: string): Promise<void> {
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(400, "Invalid or expired reset link");

  const candidates = await PasswordResetToken.find({
    userId: user._id,
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  let matched = null;
  for (const candidate of candidates) {
    if (await compareSecret(token, candidate.tokenHash)) {
      matched = candidate;
      break;
    }
  }
  if (!matched) throw new ApiError(400, "Invalid or expired reset link");

  matched.set("consumedAt", new Date());
  await matched.save();

  user.set("passwordHash", await hashSecret(newPassword));
  await user.save();

  // Invalidate all existing sessions on password change.
  await Session.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });

  await recordAuditLog({
    actorId: user._id.toString(),
    actorType: "user",
    action: "auth.password_reset",
    targetType: "User",
    targetId: user._id.toString(),
  });
}

export async function issueGoogleSession(user: UserDocument, meta: RequestMeta) {
  const tokens = await issueSession(user, meta);

  await recordAuditLog({
    actorId: user._id.toString(),
    actorType: "user",
    action: "auth.google_login",
    targetType: "User",
    targetId: user._id.toString(),
    ipAddress: meta.ip,
  });

  return { authResponse: toAuthResponse(user, tokens), refreshToken: tokens.refreshToken };
}
