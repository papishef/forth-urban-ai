import { z } from "zod";

/**
 * Validates and parses required environment variables at startup so the app
 * fails fast with a clear error instead of surfacing undefined config deep in
 * a request handler. Extend this schema as new integrations are added
 * (see docs/IMPLEMENTATION_PLAN.md "Environment variables").
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  CORS_ALLOWED_ORIGINS: z
    .string()
    .default("http://localhost:5173")
    .transform((value) => value.split(",").map((origin) => origin.trim())),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  COOKIE_DOMAIN: z.string().default("localhost"),

  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/forth-urban-db"),
  //MONGODB USER:PASS - forth-urban:2V5iZVSBMEcdMuDL

  JWT_ACCESS_SECRET: z.string().default("dev-access-secret-change-me"),
  JWT_REFRESH_SECRET: z.string().default("dev-refresh-secret-change-me"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().default("http://localhost:4000/api/auth/google/callback"),

  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().default("Forth Urban <onboarding@resend.dev>"),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Phase 5 — AI providers (OpenAI primary, Gemini fallback per docs/ARCHITECTURE.md).
  // Both optional: if a key is missing, that provider's generate() throws and
  // AIAdvisoryService falls through (eventually to a local plain-language
  // template if both are unavailable) rather than crashing the request.
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-5.1"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),

  // Phase 6 — inspection scheduler / notifications / lightweight CRM.
  // `SALES_WHATSAPP_NUMBER` is the Forth Urban sales line in international
  // format without "+" (e.g. "2348012345678"); if unset, generated wa.me
  // links omit the number and let the user pick a contact instead of failing.
  SALES_WHATSAPP_NUMBER: z.string().optional(),
  SALES_NOTIFICATION_EMAIL: z.string().default("sales@forthurban.ai"),
  QUIZ_ABANDONMENT_REMINDER_HOURS: z.coerce.number().default(48),
  // Cron jobs (abandoned-quiz nurture emails) are disabled in the test env so
  // Vitest runs don't spin up a background scheduler; enabled everywhere else.
  ENABLE_CRON_JOBS: z
    .string()
    .default("true")
    .transform((value) => value === "true"),

  // Phase 8 — analytics & monitoring. All optional: if unset, PostHog/Sentry
  // calls become no-ops rather than crashing the app (see lib/analytics.ts,
  // config/sentry.ts). LOG_LEVEL overrides the NODE_ENV-based Pino default
  // so log verbosity can be tuned per environment without a redeploy.
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).optional(),
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().default("https://us.i.posthog.com"),
  SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

// Treat blank env vars (e.g. `LOG_LEVEL=` left empty in a .env template) as
// unset rather than as an invalid empty-string value — otherwise optional
// enum fields like LOG_LEVEL fail validation on "" instead of falling back
// to their default/undefined.
const rawEnv = Object.fromEntries(
  Object.entries(process.env).map(([key, value]) => [key, value === "" ? undefined : value]),
);

export const env: Env = envSchema.parse(rawEnv);

// Fail fast in production if secrets were left at their (insecure) dev defaults.
if (env.NODE_ENV === "production") {
  const insecureDefaults: Record<string, string> = {
    JWT_ACCESS_SECRET: "dev-access-secret-change-me",
    JWT_REFRESH_SECRET: "dev-refresh-secret-change-me",
  };
  const offenders = Object.entries(insecureDefaults)
    .filter(([key, defaultValue]) => (env as unknown as Record<string, string>)[key] === defaultValue)
    .map(([key]) => key);
  if (offenders.length > 0) {
    throw new Error(`Refusing to start in production with default secrets for: ${offenders.join(", ")}`);
  }
}
