import { logger } from "../../config/logger.js";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import { InspectionBooking } from "../inspections/inspection-booking.model.js";
import { QuizResponse } from "../quiz/quiz-response.model.js";
import { User } from "../users/user.model.js";
import { EmailVerificationToken } from "./email-verification-token.model.js";
import { Session } from "./session.model.js";

export type SpamCleanupReason = "unverified_stale" | "verified_without_quiz";

export interface SpamCandidate {
  id: string;
  email: string;
  createdAt: Date;
  reason: SpamCleanupReason;
}

/** Local, non-admin accounts that never confirmed their email within the retention window. */
export async function findStaleUnverifiedAccounts(createdBefore: Date): Promise<SpamCandidate[]> {
  const users = await User.find({
    role: "user",
    authProvider: "local",
    emailVerified: false,
    createdAt: { $lt: createdBefore },
  }).select("_id email createdAt");

  return users.map((user) => ({
    id: user._id.toString(),
    email: user.email,
    createdAt: user.get("createdAt") as Date,
    reason: "unverified_stale" as const,
  }));
}

/**
 * Non-admin accounts with no quiz result, no pending registration quiz and no
 * inspection booking — the footprint of accounts created through the old
 * quiz-less paths (direct API registration, OTP auto-creation, Google).
 * Opt-in only: reviewed by a human via the cleanup script before applying.
 */
export async function findAccountsWithoutQuiz(createdBefore: Date): Promise<SpamCandidate[]> {
  const users = await User.find({ role: "user", createdAt: { $lt: createdBefore } }).select(
    "_id email createdAt +registrationQuiz",
  );
  if (users.length === 0) return [];

  const ids = users.map((user) => user._id);
  const [withQuiz, withBooking] = await Promise.all([
    QuizResponse.distinct("userId", { userId: { $in: ids } }),
    InspectionBooking.distinct("userId", { userId: { $in: ids } }),
  ]);
  const engaged = new Set([...withQuiz, ...withBooking].map((id) => String(id)));

  return users
    .filter((user) => !engaged.has(user._id.toString()) && !user.get("registrationQuiz"))
    .map((user) => ({
      id: user._id.toString(),
      email: user.email,
      createdAt: user.get("createdAt") as Date,
      reason: "verified_without_quiz" as const,
    }));
}

/**
 * Soft-deletes accounts (AGENTS.md rule #3 — no hard deletes). The email is
 * tombstoned so a real person can still register that address later; the
 * original is kept in `deletedEmail` for audit purposes.
 */
export async function softDeleteSpamAccounts(candidates: SpamCandidate[]): Promise<number> {
  const now = new Date();
  let deleted = 0;

  for (const candidate of candidates) {
    const result = await User.updateOne(
      { _id: candidate.id, deletedAt: null },
      {
        $set: {
          deletedAt: now,
          deletedEmail: candidate.email,
          email: `deleted+${candidate.id}@deleted.invalid`,
          status: "suspended",
        },
      },
    );
    if (result.modifiedCount === 0) continue;

    deleted += 1;
    await Session.updateMany({ userId: candidate.id, revokedAt: null }, { revokedAt: now });
    await EmailVerificationToken.updateMany({ userId: candidate.id, consumedAt: null }, { consumedAt: now });
    await recordAuditLog({
      actorType: "system",
      action: "user.spam_account_removed",
      targetType: "User",
      targetId: candidate.id,
      metadata: { reason: candidate.reason },
    });
  }

  return deleted;
}

/** Daily job: removes never-verified local accounts older than the retention window. */
export async function purgeStaleUnverifiedAccounts(retentionDays: number): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const candidates = await findStaleUnverifiedAccounts(cutoff);
  const deleted = await softDeleteSpamAccounts(candidates);
  if (deleted > 0) logger.info({ deleted, retentionDays }, "Purged stale unverified accounts");
  return deleted;
}
