import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import type { ApiEnvelope } from "../../middleware/error-handler.js";
import * as propertyService from "./property.service.js";

/** `GET /api/recommendations/properties` — docs/ARCHITECTURE.md#6-api-surface. */
export const recommendationsRouter: Router = Router();

recommendationsRouter.use(requireAuth);

recommendationsRouter.get("/properties", async (req, res, next) => {
  try {
    const recommendations = await propertyService.getRecommendedProperties(req.auth!.sub);
    const body: ApiEnvelope = { success: true, message: "OK", data: recommendations, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
