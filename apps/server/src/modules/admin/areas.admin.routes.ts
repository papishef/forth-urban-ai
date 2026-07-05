import { Router } from "express";
import { adminAreaInputSchema } from "@forth-urban/validation";
import type { ApiEnvelope } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import { deleteArea, listAreas, upsertArea } from "../areas/index.js";

/**
 * `GET/POST/DELETE /api/admin/areas` — Phase 7 area management, driving the
 * Best Abuja Area Quiz instead of the hardcoded lookup
 * (docs/ARCHITECTURE.md §9).
 */
export const areasAdminRouter: Router = Router();

areasAdminRouter.get("/", async (_req, res, next) => {
  try {
    const data = await listAreas();
    const body: ApiEnvelope = { success: true, message: "OK", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

areasAdminRouter.post("/", validateBody(adminAreaInputSchema), async (req, res, next) => {
  try {
    const data = await upsertArea(req.body);

    await recordAuditLog({
      actorId: req.auth!.sub,
      actorType: "admin",
      action: "admin.area.upserted",
      targetType: "Area",
      targetId: data.id,
      metadata: { preferenceKey: data.preferenceKey },
    });

    const body: ApiEnvelope = { success: true, message: "Area saved", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

areasAdminRouter.delete("/:id", async (req, res, next) => {
  try {
    await deleteArea(req.params.id);

    await recordAuditLog({
      actorId: req.auth!.sub,
      actorType: "admin",
      action: "admin.area.deleted",
      targetType: "Area",
      targetId: req.params.id,
    });

    const body: ApiEnvelope = { success: true, message: "Area removed", data: null, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
