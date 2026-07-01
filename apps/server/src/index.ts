import "dotenv/config";
import { createApp } from "./app.js";
import { logger } from "./config/logger.js";
import { env } from "./config/env.js";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`Forth Urban server listening on port ${env.PORT} (${env.NODE_ENV})`);
});
