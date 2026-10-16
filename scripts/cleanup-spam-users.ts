import { connectDatabase, disconnectDatabase } from "../apps/server/src/db/connection.js";
import { logger } from "../apps/server/src/config/logger.js";
import {
  findAccountsWithoutQuiz,
  findStaleUnverifiedAccounts,
  softDeleteSpamAccounts,
  type SpamCandidate,
} from "../apps/server/src/modules/auth/spam-account-cleanup.service.js";

/**
 * One-off cleanup of spam accounts created before quiz-gated registration.
 *
 *   --apply                     actually soft-delete (default is a dry-run report)
 *   --older-than-hours=<n>      only accounts created more than n hours ago (default 24)
 *   --include-without-quiz      also remove accounts (verified or not) that never completed
 *                               the Home-Readiness Quiz and never booked an inspection
 */
const args = process.argv.slice(2);
const shouldApply = args.includes("--apply");
const includeWithoutQuiz = args.includes("--include-without-quiz");
const olderThanArg = args.find((arg) => arg.startsWith("--older-than-hours="));
const olderThanHours = olderThanArg ? Number(olderThanArg.split("=")[1]) : 24;

async function run(): Promise<void> {
  if (!Number.isFinite(olderThanHours) || olderThanHours < 0) {
    throw new Error("--older-than-hours must be a non-negative number");
  }

  await connectDatabase();
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

  const byId = new Map<string, SpamCandidate>();
  for (const candidate of await findStaleUnverifiedAccounts(cutoff)) byId.set(candidate.id, candidate);
  if (includeWithoutQuiz) {
    for (const candidate of await findAccountsWithoutQuiz(cutoff)) {
      if (!byId.has(candidate.id)) byId.set(candidate.id, candidate);
    }
  }
  const candidates = [...byId.values()];

  for (const candidate of candidates) {
    logger.info(
      { id: candidate.id, email: candidate.email, createdAt: candidate.createdAt, reason: candidate.reason },
      "Spam cleanup candidate",
    );
  }
  logger.info(
    { mode: shouldApply ? "apply" : "dry-run", olderThanHours, includeWithoutQuiz, candidates: candidates.length },
    "Spam account cleanup report",
  );

  if (shouldApply && candidates.length > 0) {
    const deleted = await softDeleteSpamAccounts(candidates);
    logger.info({ deleted }, "Spam account cleanup applied");
  }

  await disconnectDatabase();
}

run().catch(async (err: unknown) => {
  logger.error({ err }, "Spam account cleanup failed");
  await disconnectDatabase().catch(() => undefined);
  process.exitCode = 1;
});
