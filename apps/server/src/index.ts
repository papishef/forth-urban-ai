import "./instrument.js";
import { createApp } from "./app.js";
import { logger } from "./config/logger.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./db/connection.js";
import { startScheduler } from "./lib/scheduler.js";
import { shutdownAnalytics } from "./lib/analytics.js";

async function main() {
  const app = createApp();

  // Bind the HTTP port immediately so the platform health check
  // (GET /api/health, which doesn't touch Mongo) can succeed right away.
  // connectDatabase() retries forever with backoff when Mongo is
  // unreachable/misconfigured — awaiting it before listen() previously meant
  // a bad MONGODB_URI made the server never bind its port, causing Render's
  // health check to time out even though nothing had actually crashed.
  const server = app.listen(env.PORT, () => {
    logger.info(`Forth Urban server listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  connectDatabase()
    .then(() => startScheduler())
    .catch((err) => {
      logger.error({ err }, "Database connection failed permanently");
    });

  const shutdown = async () => {
    logger.info("Shutting down gracefully…");
    server.close();
    await shutdownAnalytics();
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown());
  process.on("SIGINT", () => void shutdown());
}

main().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
