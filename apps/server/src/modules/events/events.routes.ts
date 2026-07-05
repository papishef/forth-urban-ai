import { Router } from "express";
import { trackEventSchema } from "@forth-urban/validation";
import type { ApiEnvelope } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import { trackEvent } from "../../lib/analytics.js";

/**
 * `POST /api/events` — docs/ARCHITECTURE.md#6-api-surface: forwards a small,
 * fixed set of client-fired funnel events (ones with no other server-side
 * hook — see packages/shared-types ClientTrackableEventName) to PostHog and
 * `auditLogs`, exactly like every other funnel event.
 */
export const eventsRouter: Router = Router();

eventsRouter.use(requireAuth);

eventsRouter.post("/", validateBody(trackEventSchema), async (req, res, next) => {
  try {
    const { event, properties } = req.body as { event: string; properties?: Record<string, unknown> };
    const userId = req.auth!.sub;

    trackEvent(userId, event, properties);
    await recordAuditLog({
      actorId: userId,
      actorType: "user",
      action: `client_event.${event}`,
      metadata: properties,
    });

    const body: ApiEnvelope = { success: true, message: "OK", data: null, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
