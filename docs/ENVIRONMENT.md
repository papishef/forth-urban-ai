# Environment Variables

Every environment (your laptop, a Vercel/Render **Preview** deploy for a PR, and **Production**) needs its own values for the variables below. **Never commit real secrets** — only `.env.example` (placeholder names, no values) is checked into git. Real values live in:

- **Local development:** `apps/server/.env` and `apps/client/.env` (git-ignored — copy from the matching `.env.example`).
- **Render** (backend, Preview + Production): the service's **Environment** tab (see [DEPLOYMENT.md](DEPLOYMENT.md#3-backend--render)).
- **Vercel** (frontend, Preview + Production): the project's **Settings → Environment Variables** tab, scoped per environment (see [DEPLOYMENT.md](DEPLOYMENT.md#4-frontend--vercel)).
- **GitHub Actions** (CI only — not the same as Render/Vercel): repo **Settings → Secrets and variables → Actions**. CI currently only needs the two deploy-hook secrets described in [DEPLOYMENT.md](DEPLOYMENT.md#5-github-actions-deploy-hooks-optional-extra-cicd-gate) — optional, since Render/Vercel auto-deploy from git natively.

## `apps/server`

| Variable | Required? | Example / notes | Where to get it |
|---|---|---|---|
| `NODE_ENV` | required | `development` \| `test` \| `production` | n/a — set by you |
| `PORT` | required | `4000` (Render sets its own `PORT`; leave as-is, Render injects it) | n/a |
| `CORS_ALLOWED_ORIGINS` | required | comma-separated list, e.g. `https://forth-urban.vercel.app,https://forthurban.ai` | your Vercel/custom domain(s) |
| `CLIENT_URL` | required | e.g. `https://forth-urban.vercel.app` — used in emails (reset-password links etc.) | your Vercel/custom domain |
| `COOKIE_DOMAIN` | required | `localhost` locally; your apex domain in prod (e.g. `forthurban.ai`) — must match where the client is served for the refresh-token cookie to be sent | n/a |
| `MONGODB_URI` | required | `mongodb+srv://user:pass@cluster.mongodb.net/forth-urban` | MongoDB Atlas → Database → Connect → Drivers (§1) |
| `JWT_ACCESS_SECRET` | required | long random string, e.g. `openssl rand -hex 32` | generate yourself |
| `JWT_REFRESH_SECRET` | required | long random string, **different** from the access secret | generate yourself |
| `JWT_ACCESS_TTL` | optional (default `15m`) | | n/a |
| `JWT_REFRESH_TTL` | optional (default `30d`) | | n/a |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional (Google login 503s if unset) | | Google Cloud Console → APIs & Services → Credentials (§2) |
| `GOOGLE_CALLBACK_URL` | required if Google OAuth used | e.g. `https://forth-urban-api.onrender.com/api/auth/google/callback` | your Render URL |
| `RESEND_API_KEY` | optional (emails no-op/log if unset) | | Resend dashboard → API Keys (§6) |
| `RESEND_FROM_EMAIL` | optional | `Forth Urban <onboarding@resend.dev>` until a custom domain is verified | Resend → Domains (§6) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | optional (admin media upload disabled if unset) | | Cloudinary dashboard home page (§7) |
| `OPENAI_API_KEY` | optional (falls back to Gemini, then a local template) | | platform.openai.com → API keys (§8) |
| `OPENAI_MODEL` | optional (default `gpt-5.1`) | | |
| `GEMINI_API_KEY` | optional (fallback provider) | | Google AI Studio → Get API key (§8) |
| `GEMINI_MODEL` | optional (default `gemini-2.5-flash`) | | |
| `SALES_WHATSAPP_NUMBER` | optional | international format, no `+`, e.g. `2348012345678` | your sales team's WhatsApp number |
| `SALES_NOTIFICATION_EMAIL` | optional (default `sales@forthurban.ai`) | | |
| `QUIZ_ABANDONMENT_REMINDER_HOURS` | optional (default `48`) | | |
| `ENABLE_CRON_JOBS` | optional (default `true`) | set `false` only for special one-off deploys; normally leave `true` | |
| `LOG_LEVEL` | optional | `info` in prod, `debug` if troubleshooting | |
| `POSTHOG_API_KEY` | optional | server-side (`posthog-node`) project key | PostHog → Project Settings → API Keys (§9) |
| `POSTHOG_HOST` | optional (default `https://us.i.posthog.com`) | | |
| `SENTRY_DSN` | optional | server DSN | Sentry → Project → Settings → Client Keys (DSN) (§10) |

`apps/server` **fails fast at startup in production** if `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` are left at their insecure dev defaults — you must set real values before it will boot with `NODE_ENV=production`.

## `apps/client`

All client vars are `VITE_`-prefixed, compiled into the static bundle at **build time** (not runtime) — a change requires a rebuild/redeploy, and none of these are secret (they end up visible in browser devtools).

| Variable | Required? | Example / notes | Where to get it |
|---|---|---|---|
| `VITE_API_BASE_URL` | required | `https://forth-urban-api.onrender.com/api` in prod | your Render service URL + `/api` |
| `VITE_GOOGLE_CLIENT_ID` | optional | same Client ID as the server's `GOOGLE_CLIENT_ID` (public half only) | Google Cloud Console (§2) |
| `VITE_POSTHOG_KEY` | optional | client-side PostHog project key (same PostHog project as the server key, "Project API Key") | PostHog → Project Settings → API Keys (§9) |
| `VITE_POSTHOG_HOST` | optional (default `https://us.i.posthog.com`) | | |
| `VITE_SENTRY_DSN` | optional | client DSN (a **different** Sentry project/DSN than the server one is recommended, but a single project also works) | Sentry (§10) |

## Notes

- The plan in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) originally listed `ANTHROPIC_API_KEY` as the fallback AI provider — the actual implementation (Phase 5) uses **Gemini** instead (`GEMINI_API_KEY`/`GEMINI_MODEL`); that prose line in the plan is stale.
- Section numbers above (§1, §2, ...) reference the matching numbered section in [DEPLOYMENT.md](DEPLOYMENT.md).
