import cron from "node-cron";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { sendAbandonedQuizReminders } from "../modules/notifications/index.js";
import { purgeStaleUnverifiedAccounts } from "../modules/auth/spam-account-cleanup.service.js";

/**
 * Daily cron job for the quiz-abandonment nurture email
 * (docs/IMPLEMENTATION_PLAN.md Phase 6 — "abandoned-quiz reminder email
 * fires on a scheduled job (node-cron or Render cron job)"). Started only
 * from apps/server/src/index.ts (the real process entrypoint), never from
 * app.ts, so Supertest/Vitest runs that build an app via `createApp()`
 * never spin up a background timer.
 */
export function startScheduler(): void {
  if (env.NODE_ENV === "test" || !env.ENABLE_CRON_JOBS) {
    return;
  }

  // Once a day at 09:00 server time.
  cron.schedule("0 9 * * *", () => {
    sendAbandonedQuizReminders().catch((err) => {
      logger.error({ err }, "Abandoned-quiz reminder job failed");
    });
  });

  // Once a day at 03:00: soft-delete never-verified sign-ups (spam / typo
  // emails) so they don't pile up or lock email addresses.
  cron.schedule("0 3 * * *", () => {
    purgeStaleUnverifiedAccounts(env.UNVERIFIED_ACCOUNT_RETENTION_DAYS).catch((err) => {
      logger.error({ err }, "Unverified-account purge job failed");
    });
  });

  logger.info("Scheduled daily abandoned-quiz reminder and unverified-account purge jobs");
}
