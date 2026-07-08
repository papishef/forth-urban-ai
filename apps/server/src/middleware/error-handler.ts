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

/** Reads a numeric `.statusCode`/`.status` off common non-ApiError errors (e.g. body-parser's 413 "entity too large", malformed-JSON 400s) so they aren't miscategorized as 500s. */
function readStatusCode(err: unknown): number | null {
  if (typeof err !== "object" || err === null) return null;
  const candidate = (err as { statusCode?: unknown; status?: unknown }).statusCode ?? (err as { status?: unknown }).status;
  return typeof candidate === "number" && candidate >= 400 && candidate < 600 ? candidate : null;
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : (readStatusCode(err) ?? 500);
  const errors = isApiError ? err.errors : null;

  if (statusCode >= 500) {
    req.log?.error({ err }, "Unhandled error");
  }

  // ApiError messages, and 4xx messages from well-known framework errors
  // (e.g. body-parser's "request entity too large"), are safe to show end
  // users. Only truly unexpected 5xx errors get the generic, detail-free
  // fallback so we never leak internals (driver error text, stack traces,
  // etc.) to the client — those still get logged above with full detail.
  const message = isApiError || (statusCode < 500 && err instanceof Error)
    ? (err as Error).message
    : "Something went wrong. Please try again.";

  const body: ApiEnvelope = {
    success: false,
    message,
    data: null,
    errors,
  };

  res.status(statusCode).json(body);
}
