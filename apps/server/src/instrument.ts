import "dotenv/config";
import { initSentry } from "./config/sentry.js";

// Sentry must be initialized before any other module (express, mongoose,
// etc.) is imported so its auto-instrumentation can wrap them. index.ts
// imports this file first, before anything else.
initSentry();
