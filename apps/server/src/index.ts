import "./instrument.js";
import { createApp } from "./app.js";
import { logger } from "./config/logger.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./db/connection.js";
import { startScheduler } from "./lib/scheduler.js";
import { shutdownAnalytics } from "./lib/analytics.js";

async function main() {
  await connectDatabase();

  const app = createApp();
  startScheduler();

  const server = app.listen(env.PORT, () => {
    logger.info(`Forth Urban server listening on port ${env.PORT} (${env.NODE_ENV})`);
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
