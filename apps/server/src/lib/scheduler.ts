import cron from "node-cron";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { sendAbandonedQuizReminders } from "../modules/notifications/index.js";

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

  logger.info("Scheduled daily abandoned-quiz reminder job");
}
