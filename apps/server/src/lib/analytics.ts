import { PostHog } from "posthog-node";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

let client: PostHog | null = null;

/** Lazily builds the PostHog client from env config; returns null (no-op) if POSTHOG_API_KEY isn't set. */
function getClient(): PostHog | null {
  if (!env.POSTHOG_API_KEY) return null;
  if (!client) {
    client = new PostHog(env.POSTHOG_API_KEY, { host: env.POSTHOG_HOST });
  }
  return client;
}

/**
 * Fire-and-forget PostHog event capture. Never throws — an analytics outage
 * must not break the request it's tracking (errors are logged instead).
 */
export function trackEvent(distinctId: string, event: string, properties?: Record<string, unknown>): void {
  const posthog = getClient();
  if (!posthog) return;
  try {
    posthog.capture({ distinctId, event, properties });
  } catch (err) {
    logger.warn({ err, event }, "PostHog capture failed");
  }
}

/** Flushes and closes the PostHog client — call once on graceful shutdown (src/index.ts). */
export async function shutdownAnalytics(): Promise<void> {
  if (client) await client.shutdown();
}

/**
 * Maps `auditLogs.action` strings (written via recordAuditLog) to the
 * canonical PostHog event names in docs/ARCHITECTURE.md §7, so writing an
 * audit log entry for a funnel-relevant action automatically fires the
 * matching analytics event too — see lib/audit-log.service.ts, which calls
 * this after every successful write. No need to add a separate trackEvent()
 * call at each of the ~30 recordAuditLog() call sites across the codebase.
 */
const AUDIT_ACTION_TO_EVENT: Record<string, string> = {
  "auth.register": "account_created",
  "auth.login": "login_completed",
  "auth.otp_verified": "login_completed",
  "auth.google_login": "login_completed",
  "quiz.started": "quiz_started",
  "quiz.completed": "quiz_completed",
  "quiz.readiness_result_viewed": "readiness_result_viewed",
  "property.recommended": "property_recommended",
  "calculator.budget_calculated": "budget_calculated",
  "calculator.hidden_cost_viewed": "hidden_cost_viewed",
  "calculator.roi_calculated": "roi_calculated",
  "inspection.booked": "inspection_booked",
};

/** Returns the PostHog event name(s) that should fire for a given audit log action + metadata. */
export function analyticsEventsForAuditAction(action: string, metadata?: Record<string, unknown>): string[] {
  const events: string[] = [];
  const mapped = AUDIT_ACTION_TO_EVENT[action];
  if (mapped) events.push(mapped);
  // The Best Abuja Area Quiz shares the "quiz.completed" action with a
  // `quizType` metadata discriminator — fire its own dedicated event too.
  if (action === "quiz.completed" && metadata?.["quizType"] === "area") events.push("area_quiz_completed");
  return events;
}
