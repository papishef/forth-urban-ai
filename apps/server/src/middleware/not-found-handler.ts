import type { Request, Response } from "express";
import type { ApiEnvelope } from "./error-handler.js";

export function notFoundHandler(req: Request, res: Response) {
  const body: ApiEnvelope = {
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    data: null,
    errors: null,
  };
  res.status(404).json(body);
}
