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

  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/forth-urban"),

  JWT_ACCESS_SECRET: z.string().default("dev-access-secret-change-me"),
  JWT_REFRESH_SECRET: z.string().default("dev-refresh-secret-change-me"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().default("http://localhost:4000/api/auth/google/callback"),

  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().default("Forth Urban <onboarding@resend.dev>"),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);

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
