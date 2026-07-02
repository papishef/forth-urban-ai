import "dotenv/config";
import { createApp } from "./app.js";
import { logger } from "./config/logger.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./db/connection.js";

async function main() {
  await connectDatabase();

  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info(`Forth Urban server listening on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

main().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
