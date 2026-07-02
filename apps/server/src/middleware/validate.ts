import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { ApiError } from "./error-handler.js";

/** Validates `req.body` against a Zod schema, replacing it with the parsed (typed) value. */
export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new ApiError(400, "Invalid request body", result.error.issues));
      return;
    }
    req.body = result.data;
    next();
  };
}
