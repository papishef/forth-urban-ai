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
  MONGODB_URI: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
