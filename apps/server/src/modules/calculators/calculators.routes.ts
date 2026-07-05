import { Router } from "express";
import {
  budgetCalculatorInputSchema,
  hiddenCostCalculatorInputSchema,
  roiCalculatorInputSchema,
} from "@forth-urban/validation";
import type { ApiEnvelope } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth } from "../auth/auth.middleware.js";
import * as calculatorsService from "./calculators.service.js";

/**
 * `POST /api/calculators/budget|hidden-cost|roi` — docs/ARCHITECTURE.md#6-api-surface.
 *
 * Account-gated like the rest of the funnel. Every response returns numbers
 * computed entirely by the Decision Engine plus a deterministic next-best-action.
 */
export const calculatorsRouter: Router = Router();

calculatorsRouter.use(requireAuth);

calculatorsRouter.post("/budget", validateBody(budgetCalculatorInputSchema), async (req, res, next) => {
  try {
    const result = await calculatorsService.runBudgetCalculator(req.auth!.sub, req.body);
    const body: ApiEnvelope = { success: true, message: "OK", data: result, errors: null };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

calculatorsRouter.post("/hidden-cost", validateBody(hiddenCostCalculatorInputSchema), async (req, res, next) => {
  try {
    const result = await calculatorsService.runHiddenCostCalculator(req.auth!.sub, req.body);
    const body: ApiEnvelope = { success: true, message: "OK", data: result, errors: null };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

calculatorsRouter.post("/roi", validateBody(roiCalculatorInputSchema), async (req, res, next) => {
  try {
    const result = await calculatorsService.runRoiCalculator(req.auth!.sub, req.body);
    const body: ApiEnvelope = { success: true, message: "OK", data: result, errors: null };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});
