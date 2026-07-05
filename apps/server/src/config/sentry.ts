import * as Sentry from "@sentry/node";
import { env } from "./env.js";

/**
 * Initializes Sentry error monitoring. A no-op if SENTRY_DSN isn't configured
 * (local dev/test/free-tier environments without a Sentry project) — every
 * `Sentry.*` call elsewhere in the codebase is safe to make unconditionally
 * since the SDK silently drops events when it was never initialized.
 *
 * Must be called before any other module is imported (see src/instrument.ts)
 * so Sentry's auto-instrumentation can hook into http/mongodb/etc.
 */
export function initSentry(): void {
  if (!env.SENTRY_DSN) return;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    // Modest tracing sample rate in production only — free-tier cost control.
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 0,
  });
}

export { Sentry };
