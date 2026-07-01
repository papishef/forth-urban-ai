import type { NextFunction, Request, Response } from "express";

/**
 * Standard envelope used by every API response so the client can rely on a
 * single shape: { success, message, data, errors }.
 */
export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  errors: unknown[] | null;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors: unknown[] | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err instanceof Error ? err.message : "Internal server error";
  const errors = err instanceof ApiError ? err.errors : null;

  if (statusCode >= 500) {
    req.log?.error({ err }, "Unhandled error");
  }

  const body: ApiEnvelope = {
    success: false,
    message: statusCode >= 500 ? "Something went wrong. Please try again." : message,
    data: null,
    errors,
  };

  res.status(statusCode).json(body);
}
