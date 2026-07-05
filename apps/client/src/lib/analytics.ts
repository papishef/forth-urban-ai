import posthog from "posthog-js";
import { apiClient } from "./api-client";
import type { ClientTrackableEventName } from "@forth-urban/shared-types";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "https://us.i.posthog.com";

let initialized = false;

/** Initializes PostHog (autocapture + pageviews) — a no-op if VITE_POSTHOG_KEY isn't configured. */
export function initAnalytics(): void {
  if (!POSTHOG_KEY || initialized) return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    person_profiles: "identified_only",
  });
  initialized = true;
}

/** Associates future PostHog events with the logged-in user (call on login/register success). */
export function identifyAnalyticsUser(userId: string, properties?: Record<string, unknown>): void {
  if (!POSTHOG_KEY) return;
  posthog.identify(userId, properties);
}

/** Clears PostHog's local identity (call on logout). */
export function resetAnalytics(): void {
  if (!POSTHOG_KEY) return;
  posthog.reset();
}

/**
 * Fires one of the small, fixed set of client-only funnel events
 * (docs/ARCHITECTURE.md §7) via `POST /api/events`, which forwards it to
 * PostHog + auditLogs server-side. Fire-and-forget: never blocks or breaks
 * the UI action it's attached to (e.g. a WhatsApp link click).
 */
export function trackClientEvent(event: ClientTrackableEventName, properties?: Record<string, unknown>): void {
  void apiClient.post("/events", { event, properties }).catch(() => {
    // Analytics failures must never surface to the user.
  });
}
