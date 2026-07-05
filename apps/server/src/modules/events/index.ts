/**
 * Events module — Phase 8 (analytics & monitoring).
 *
 * Owns the generic `POST /api/events` endpoint the client uses to fire the
 * handful of funnel events that have no other server-side hook to piggyback
 * analytics tracking on (docs/ARCHITECTURE.md §6/§7). Every other funnel
 * event is tracked automatically alongside its existing recordAuditLog()
 * call — see apps/server/src/lib/analytics.ts.
 */
export { eventsRouter } from "./events.routes.js";
