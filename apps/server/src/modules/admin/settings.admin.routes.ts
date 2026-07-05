import { Router } from "express";
import { adminUpdateSettingsSchema } from "@forth-urban/validation";
import type { ApiEnvelope } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import { getSettings, updateSettings } from "../settings/index.js";

/**
 * `GET/PATCH /api/admin/settings` — Phase 7 ROI assumption defaults +
 * property matching rule weights editor, so behavior changes don't need a
 * redeploy (docs/IMPLEMENTATION_PLAN.md#phase-7--admin-dashboard).
 */
export const settingsAdminRouter: Router = Router();

settingsAdminRouter.get("/", async (_req, res, next) => {
  try {
    const data = await getSettings();
    const body: ApiEnvelope = { success: true, message: "OK", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

settingsAdminRouter.patch("/", validateBody(adminUpdateSettingsSchema), async (req, res, next) => {
  try {
    const data = await updateSettings(req.body);

    await recordAuditLog({
      actorId: req.auth!.sub,
      actorType: "admin",
      action: "admin.settings.updated",
      targetType: "Settings",
      metadata: req.body,
    });

    const body: ApiEnvelope = { success: true, message: "Settings updated", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
