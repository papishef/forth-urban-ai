import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { logger } from "./config/logger.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found-handler.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { authRouter } from "./modules/auth/index.js";
import { usersRouter, profilesRouter } from "./modules/users/index.js";
import { quizRouter } from "./modules/quiz/index.js";
import { passport } from "./modules/auth/passport.js";

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
  app.use(cookieParser());
  app.use(passport.initialize());
  app.use(pinoHttp({ logger }));

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/profiles", profilesRouter);
  app.use("/api/quiz", quizRouter);

  // Feature modules are registered here as they are built out. See
  // docs/IMPLEMENTATION_PLAN.md for the phase each module belongs to:
  //   Phase 3: properties, recommendations
  //   Phase 4: calculators (part of decision-engine)
  //   Phase 5: ai-advisory
  //   Phase 6: inspections, crm, notifications
  //   Phase 7: admin

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
