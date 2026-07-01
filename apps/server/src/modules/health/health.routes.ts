import { Router } from "express";
import type { ApiEnvelope } from "../../middleware/error-handler.js";

export const healthRouter: Router = Router();

healthRouter.get("/", (_req, res) => {
  const body: ApiEnvelope<{ status: "ok"; timestamp: string }> = {
    success: true,
    message: "Forth Urban API is healthy",
    data: { status: "ok", timestamp: new Date().toISOString() },
    errors: null,
  };
  res.json(body);
});
