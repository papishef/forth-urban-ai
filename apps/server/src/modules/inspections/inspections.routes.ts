import { Router } from "express";
import { inspectionBookingInputSchema } from "@forth-urban/validation";
import type { ApiEnvelope } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth } from "../auth/auth.middleware.js";
import * as inspectionsService from "./inspections.service.js";

/**
 * `POST /api/inspections`, `GET /api/inspections/me` — docs/ARCHITECTURE.md#6-api-surface.
 *
 * The sole conversion event of the funnel (PRODUCT_SPEC §11). Account-gated
 * like the rest of the funnel.
 */
export const inspectionsRouter: Router = Router();

inspectionsRouter.use(requireAuth);

inspectionsRouter.post("/", validateBody(inspectionBookingInputSchema), async (req, res, next) => {
  try {
    const result = await inspectionsService.bookInspection(req.auth!.sub, req.body);
    const body: ApiEnvelope = { success: true, message: "OK", data: result, errors: null };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

inspectionsRouter.get("/me", async (req, res, next) => {
  try {
    const result = await inspectionsService.listMyInspections(req.auth!.sub);
    const body: ApiEnvelope = { success: true, message: "OK", data: result, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
