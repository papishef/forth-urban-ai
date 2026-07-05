import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  aiAskInputSchema,
  aiInspectionAdviceInputSchema,
  aiRecommendationExplainerInputSchema,
  aiRoiExplainerInputSchema,
} from "@forth-urban/validation";
import type { ApiEnvelope } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth } from "../auth/auth.middleware.js";
import * as aiAdvisoryOrchestrator from "./ai-advisory.orchestrator.js";

/**
 * `POST /api/ai/*` — docs/ARCHITECTURE.md#llm-advisory-layer-appsserversrcmodulesai-advisory.
 *
 * Account-gated like the rest of the funnel. Every response is explanatory
 * text about numbers the Decision Engine already computed elsewhere — never
 * a number the LLM invented itself.
 *
 * A tighter, endpoint-specific rate limit sits on top of the global one
 * (docs/IMPLEMENTATION_PLAN.md Phase 11 "rate limiting on auth/AI endpoints
 * specifically (cost control)") since every call here costs real money.
 */
export const aiAdvisoryRouter: Router = Router();

aiAdvisoryRouter.use(requireAuth);
aiAdvisoryRouter.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

aiAdvisoryRouter.post("/quiz-summary", async (req, res, next) => {
  try {
    const result = await aiAdvisoryOrchestrator.generateQuizSummary(req.auth!.sub);
    const body: ApiEnvelope = { success: true, message: "OK", data: result, errors: null };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

aiAdvisoryRouter.post("/buyer-persona", async (req, res, next) => {
  try {
    const result = await aiAdvisoryOrchestrator.generateBuyerPersona(req.auth!.sub);
    const body: ApiEnvelope = { success: true, message: "OK", data: result, errors: null };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

aiAdvisoryRouter.post(
  "/recommendation-explainer",
  validateBody(aiRecommendationExplainerInputSchema),
  async (req, res, next) => {
    try {
      const result = await aiAdvisoryOrchestrator.generateRecommendationExplainer(req.auth!.sub, req.body);
      const body: ApiEnvelope = { success: true, message: "OK", data: result, errors: null };
      res.status(201).json(body);
    } catch (err) {
      next(err);
    }
  },
);

aiAdvisoryRouter.post("/roi-explainer", validateBody(aiRoiExplainerInputSchema), async (req, res, next) => {
  try {
    const result = await aiAdvisoryOrchestrator.generateRoiExplainer(req.auth!.sub, req.body);
    const body: ApiEnvelope = { success: true, message: "OK", data: result, errors: null };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

aiAdvisoryRouter.post("/inspection-advice", validateBody(aiInspectionAdviceInputSchema), async (req, res, next) => {
  try {
    const result = await aiAdvisoryOrchestrator.generateInspectionAdvice(req.auth!.sub, req.body);
    const body: ApiEnvelope = { success: true, message: "OK", data: result, errors: null };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

aiAdvisoryRouter.post("/ask", validateBody(aiAskInputSchema), async (req, res, next) => {
  try {
    const result = await aiAdvisoryOrchestrator.askAdvisor(req.auth!.sub, req.body);
    const body: ApiEnvelope = { success: true, message: "OK", data: result, errors: null };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});
