import { Router } from "express";
import type { ApiEnvelope } from "../../middleware/error-handler.js";
import { requireAuth } from "../auth/auth.middleware.js";
import * as notificationsService from "./notifications.service.js";

/**
 * `GET /api/notifications/me`, `PATCH /api/notifications/:id/read` — in-app
 * notification feed backing the client's basic browser Notification API
 * integration (docs/IMPLEMENTATION_PLAN.md Phase 6).
 */
export const notificationsRouter: Router = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get("/me", async (req, res, next) => {
  try {
    const notifications = await notificationsService.listNotifications(req.auth!.sub);
    const body: ApiEnvelope = { success: true, message: "OK", data: notifications, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

notificationsRouter.patch("/:id/read", async (req, res, next) => {
  try {
    const notification = await notificationsService.markNotificationRead(req.auth!.sub, req.params.id);
    const body: ApiEnvelope = { success: true, message: "OK", data: notification, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
