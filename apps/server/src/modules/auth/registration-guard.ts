import crypto from "node:crypto";
import { Resolver } from "node:dns/promises";
import jwt from "jsonwebtoken";
import type { RegistrationQuizSessionDTO } from "@forth-urban/shared-types";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { ApiError } from "../../middleware/error-handler.js";
import { isDisposableEmailDomain } from "./disposable-email-domains.js";
import { RegistrationQuizToken } from "./registration-quiz-token.model.js";

/**
 * Server-side anti-spam gate for account creation. Every new account (email
 * or Google) must present:
 *   1. a server-signed quiz session token issued when the visitor started the
 *      Home-Readiness Quiz, at least REGISTRATION_MIN_QUIZ_SECONDS old and
 *      single-use (bots posting straight to /auth/register can't forge it and
 *      can't finish a "quiz" instantly);
 *   2. the completed, schema-valid quiz answers (enforced by Zod upstream);
 *   3. an empty honeypot field;
 *   4. a non-disposable email domain that can actually receive mail.
 * Combined with per-IP rate limits on the routes, scripted sign-ups become
 * slow, expensive and easy to spot in logs.
 */

const QUIZ_SESSION_TOKEN_TYPE = "registration_quiz";
const QUIZ_SESSION_AUDIENCE = "forth-urban:registration";
const INVALID_QUIZ_SESSION_MESSAGE =
  "Your quiz session has expired. Please retake the Home-Readiness Quiz to create your account.";
const TOO_FAST_MESSAGE = "Please complete the Home-Readiness Quiz before creating your account.";
const UNDELIVERABLE_EMAIL_MESSAGE = "Please use a permanent email address you can receive mail at.";

export interface VerifiedQuizSession {
  jti: string;
  issuedAt: Date;
  expiresAt: Date;
}

/** Exposed for tests so they can mint a token that already satisfies the minimum quiz duration. */
export function signRegistrationQuizSessionToken(issuedAt: Date = new Date()): { token: string; expiresAt: Date } {
  const iat = Math.floor(issuedAt.getTime() / 1000);
  const exp = iat + env.REGISTRATION_QUIZ_SESSION_TTL_HOURS * 3600;
  const token = jwt.sign(
    { type: QUIZ_SESSION_TOKEN_TYPE, iat, exp, jti: crypto.randomUUID(), aud: QUIZ_SESSION_AUDIENCE },
    env.JWT_ACCESS_SECRET,
  );
  return { token, expiresAt: new Date(exp * 1000) };
}

export function issueRegistrationQuizSession(): RegistrationQuizSessionDTO {
  const { token, expiresAt } = signRegistrationQuizSessionToken();
  return {
    quizSessionToken: token,
    expiresAt: expiresAt.toISOString(),
    minCompletionSeconds: env.REGISTRATION_MIN_QUIZ_SECONDS,
  };
}

/** Verifies signature, type, expiry and minimum elapsed quiz time. Does not consume the token. */
export function verifyRegistrationQuizSession(token: string, ip: string | null): VerifiedQuizSession {
  let decoded: jwt.JwtPayload;
  try {
    decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { audience: QUIZ_SESSION_AUDIENCE }) as jwt.JwtPayload;
  } catch {
    logger.warn({ ip, reason: "invalid_quiz_session" }, "Registration blocked");
    throw new ApiError(400, INVALID_QUIZ_SESSION_MESSAGE);
  }

  if (
    decoded.type !== QUIZ_SESSION_TOKEN_TYPE ||
    typeof decoded.jti !== "string" ||
    typeof decoded.iat !== "number" ||
    typeof decoded.exp !== "number"
  ) {
    logger.warn({ ip, reason: "invalid_quiz_session" }, "Registration blocked");
    throw new ApiError(400, INVALID_QUIZ_SESSION_MESSAGE);
  }

  const elapsedSeconds = Date.now() / 1000 - decoded.iat;
  if (elapsedSeconds < env.REGISTRATION_MIN_QUIZ_SECONDS) {
    logger.warn({ ip, reason: "quiz_too_fast", elapsedSeconds }, "Registration blocked");
    throw new ApiError(400, TOO_FAST_MESSAGE);
  }

  return { jti: decoded.jti, issuedAt: new Date(decoded.iat * 1000), expiresAt: new Date(decoded.exp * 1000) };
}

/** Atomically marks a quiz session as used — one completed quiz creates at most one account. */
export async function consumeRegistrationQuizSession(
  session: VerifiedQuizSession,
  meta: { ip: string | null; userId?: string | null },
): Promise<void> {
  try {
    await RegistrationQuizToken.create({
      jti: session.jti,
      consumedBy: meta.userId ?? null,
      ip: meta.ip,
      expiresAt: session.expiresAt,
    });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      logger.warn({ ip: meta.ip, reason: "quiz_session_replay" }, "Registration blocked");
      throw new ApiError(400, INVALID_QUIZ_SESSION_MESSAGE);
    }
    throw err;
  }
}

export async function isRegistrationQuizSessionConsumed(jti: string): Promise<boolean> {
  return (await RegistrationQuizToken.countDocuments({ jti })) > 0;
}

/** Hidden form field humans never see; any value means an automated submission. */
export function isHoneypotTriggered(value: string | undefined | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

const DNS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const DNS_CACHE_MAX_ENTRIES = 5000;
const dnsCache = new Map<string, { acceptsMail: boolean | null; checkedAt: number }>();
const resolver = new Resolver({ timeout: 2500, tries: 1 });

function dnsErrorCode(err: unknown): string | undefined {
  return (err as { code?: string }).code;
}

/** true = domain can receive mail, false = it definitely can't, null = DNS inconclusive (fail open). */
async function lookupDomainAcceptsMail(domain: string): Promise<boolean | null> {
  try {
    const records = await resolver.resolveMx(domain);
    // RFC 7505 "null MX" (single record with an empty exchange) means the
    // domain explicitly does not accept email.
    const usable = records.filter((record) => record.exchange && record.exchange !== ".");
    if (usable.length > 0) return true;
    if (records.length > 0) return false;
  } catch (err) {
    const code = dnsErrorCode(err);
    if (code === "ENOTFOUND") return false;
    if (code !== "ENODATA") return null;
  }

  // No MX records: RFC 5321 falls back to the domain's A/AAAA record.
  for (const lookup of [() => resolver.resolve4(domain), () => resolver.resolve6(domain)]) {
    try {
      if ((await lookup()).length > 0) return true;
    } catch (err) {
      const code = dnsErrorCode(err);
      if (code !== "ENODATA" && code !== "ENOTFOUND") return null;
    }
  }
  return false;
}

async function domainAcceptsMail(domain: string): Promise<boolean | null> {
  const cached = dnsCache.get(domain);
  if (cached && Date.now() - cached.checkedAt < DNS_CACHE_TTL_MS) return cached.acceptsMail;

  const acceptsMail = await lookupDomainAcceptsMail(domain);
  if (dnsCache.size >= DNS_CACHE_MAX_ENTRIES) dnsCache.clear();
  // Don't cache inconclusive lookups — a transient DNS failure shouldn't stick.
  if (acceptsMail !== null) dnsCache.set(domain, { acceptsMail, checkedAt: Date.now() });
  return acceptsMail;
}

/** Rejects disposable inboxes and domains with no mail server (typo/fake domains). */
export async function assertRegistrationEmailAllowed(email: string, ip: string | null): Promise<void> {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) throw new ApiError(400, UNDELIVERABLE_EMAIL_MESSAGE);

  if (isDisposableEmailDomain(domain)) {
    logger.warn({ ip, domain, reason: "disposable_email" }, "Registration blocked");
    throw new ApiError(400, UNDELIVERABLE_EMAIL_MESSAGE);
  }

  if (env.NODE_ENV === "test" || !env.REGISTRATION_EMAIL_DNS_CHECK) return;

  if ((await domainAcceptsMail(domain)) === false) {
    logger.warn({ ip, domain, reason: "undeliverable_email_domain" }, "Registration blocked");
    throw new ApiError(400, UNDELIVERABLE_EMAIL_MESSAGE);
  }
}
