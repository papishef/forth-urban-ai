import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import type { ApiEnvelope } from "../../middleware/error-handler.js";
import * as propertyService from "./property.service.js";

/**
 * `GET /api/properties`, `GET /api/properties/:id` — docs/ARCHITECTURE.md#6-api-surface.
 *
 * Account-gated like the rest of the funnel (AGENTS.md §1 — the app is an
 * account-gated consultation funnel, not a public catalogue).
 */
export const propertiesRouter: Router = Router();

propertiesRouter.use(requireAuth);

propertiesRouter.get("/", async (_req, res, next) => {
  try {
    const properties = await propertyService.listProperties();
    const body: ApiEnvelope = { success: true, message: "OK", data: properties, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

propertiesRouter.get("/:id", async (req, res, next) => {
  try {
    const result = await propertyService.getPropertyById(req.auth!.sub, req.params.id);
    const body: ApiEnvelope = { success: true, message: "OK", data: result, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
