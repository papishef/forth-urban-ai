import * as Sentry from "@sentry/react";

/** Initializes Sentry error monitoring — a no-op if VITE_SENTRY_DSN isn't configured. */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
  });
}

export { Sentry };
