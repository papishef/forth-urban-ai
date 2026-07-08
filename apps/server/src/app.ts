import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { randomUUID } from "node:crypto";
import { rateLimit } from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { logger } from "./config/logger.js";
import { env } from "./config/env.js";
import { Sentry } from "./config/sentry.js";
import { openApiDocument } from "./config/openapi.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found-handler.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { authRouter } from "./modules/auth/index.js";
import { requireAuth, requireRole } from "./modules/auth/auth.middleware.js";
import { usersRouter, profilesRouter } from "./modules/users/index.js";
import { quizRouter } from "./modules/quiz/index.js";
import { propertiesRouter, recommendationsRouter } from "./modules/properties/index.js";
import { calculatorsRouter } from "./modules/calculators/index.js";
import { aiAdvisoryRouter } from "./modules/ai-advisory/index.js";
import { inspectionsRouter } from "./modules/inspections/index.js";
import { notificationsRouter } from "./modules/notifications/index.js";
import { adminRouter } from "./modules/admin/index.js";
import { eventsRouter } from "./modules/events/index.js";
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
  // Admin property media uploads send base64-encoded file data as JSON
  // (see properties.admin.routes.ts) instead of multipart/form-data, so the
  // body-parser limit needs enough headroom for a base64-inflated photo
  // (~1.34x the raw file size) — express's 100kb default silently rejected
  // every photo upload with a 413 before it ever reached our route/size
  // validation in cloudinary.util.ts.
  app.use(express.json({ limit: "20mb" }));

  app.use(cookieParser());
  app.use(passport.initialize());
  app.use(
    pinoHttp({
      logger,
      // Structured request-id logging (Phase 8): reuse an inbound
      // X-Request-Id if a proxy/load balancer already set one, otherwise
      // generate a fresh UUID and echo it back so client/server logs for
      // the same request can be correlated.
      genReqId: (req, res) => {
        const existing = req.headers["x-request-id"];
        if (typeof existing === "string" && existing.length > 0) return existing;
        const id = randomUUID();
        res.setHeader("x-request-id", id);
        return id;
      },
    }),
  );

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/profiles", profilesRouter);
  app.use("/api/quiz", quizRouter);
  app.use("/api/properties", propertiesRouter);
  app.use("/api/recommendations", recommendationsRouter);
  app.use("/api/calculators", calculatorsRouter);
  app.use("/api/ai", aiAdvisoryRouter);
  app.use("/api/inspections", inspectionsRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/events", eventsRouter);

  // Phase 10: OpenAPI/Swagger UI (docs/IMPLEMENTATION_PLAN.md#phase-10). Open
  // in non-production so local/preview developers can explore the API
  // freely; gated behind admin auth in production so the surface isn't
  // publicly discoverable once real user data is at stake.
  const docsGuards = env.NODE_ENV === "production" ? [requireAuth, requireRole("admin")] : [];
  app.use("/api/docs", ...docsGuards, swaggerUi.serve, swaggerUi.setup(openApiDocument));

  // Feature modules are registered here as they are built out. See
  // docs/IMPLEMENTATION_PLAN.md for the phase each module belongs to:
  //   Phase 6: crm (no public routes yet — service-only, consumed by
  //             inspections; admin CRM board is Phase 7)
  //   Phase 7: admin
  //   Phase 8: events (generic client-fired analytics events)

  app.use(notFoundHandler);
  Sentry.setupExpressErrorHandler(app);
  app.use(errorHandler);

  return app;
}
