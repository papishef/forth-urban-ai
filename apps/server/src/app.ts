import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { logger } from "./config/logger.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found-handler.js";
import { healthRouter } from "./modules/health/health.routes.js";

/**
 * Builds the Express application. Kept as a factory (rather than a module-level
 * singleton) so tests can create isolated instances via Supertest.
 */
export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ALLOWED_ORIGINS,
      credentials: true,
    }),
  );
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  app.use("/api/health", healthRouter);

  // Feature modules are registered here as they are built out. See
  // docs/IMPLEMENTATION_PLAN.md for the phase each module belongs to:
  //   Phase 1: auth, users
  //   Phase 2: quiz, decision-engine
  //   Phase 3: properties, recommendations
  //   Phase 4: calculators (part of decision-engine)
  //   Phase 5: ai-advisory
  //   Phase 6: inspections, crm, notifications
  //   Phase 7: admin

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
