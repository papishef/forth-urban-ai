import { Router } from "express";
import { areaQuizAnswersSchema, homeReadinessAnswersSchema } from "@forth-urban/validation";
import { ApiError, type ApiEnvelope } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth } from "../auth/auth.middleware.js";
import * as quizService from "./quiz.service.js";

export const quizRouter: Router = Router();

// Account layer is required before any personalized result (PRODUCT_SPEC §3).
quizRouter.use(requireAuth);

function requestIp(req: { ip?: string }): { ip: string | null } {
  return { ip: req.ip ?? null };
}

quizRouter.post("/home-readiness/start", async (req, res, next) => {
  try {
    await quizService.startQuiz(req.auth!.sub, "homeReadiness", requestIp(req));
    const body: ApiEnvelope = { success: true, message: "Quiz started", data: null, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

quizRouter.post("/home-readiness", validateBody(homeReadinessAnswersSchema), async (req, res, next) => {
  try {
    const result = await quizService.submitHomeReadinessQuiz(req.auth!.sub, req.body, requestIp(req));
    const body: ApiEnvelope = { success: true, message: "Readiness result ready", data: result, errors: null };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

quizRouter.get("/home-readiness/result", async (req, res, next) => {
  try {
    const result = await quizService.getHomeReadinessResult(req.auth!.sub);
    if (!result) throw new ApiError(404, "Complete the Home-Readiness Quiz to see your result");

    const body: ApiEnvelope = { success: true, message: "OK", data: result, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

quizRouter.post("/area/start", async (req, res, next) => {
  try {
    await quizService.startQuiz(req.auth!.sub, "area", requestIp(req));
    const body: ApiEnvelope = { success: true, message: "Quiz started", data: null, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

quizRouter.post("/area", validateBody(areaQuizAnswersSchema), async (req, res, next) => {
  try {
    const result = await quizService.submitAreaQuiz(req.auth!.sub, req.body, requestIp(req));
    const body: ApiEnvelope = { success: true, message: "Area recommendation ready", data: result, errors: null };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

quizRouter.get("/area/result", async (req, res, next) => {
  try {
    const result = await quizService.getAreaQuizResult(req.auth!.sub);
    if (!result) throw new ApiError(404, "Complete the Best Abuja Area Quiz to see your result");

    const body: ApiEnvelope = { success: true, message: "OK", data: result, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
