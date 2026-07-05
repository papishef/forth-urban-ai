# Deployment Guide

Step-by-step setup for everything in [IMPLEMENTATION_PLAN.md Phase 10](IMPLEMENTATION_PLAN.md#phase-10--cicd--deployment). Every section below is a **manual, one-time (or occasional) task performed in a web dashboard** — none of it can be done by an AI agent running in this repo, since it requires your own accounts, billing, and login credentials. Do them in order; later sections depend on values created in earlier ones.

Free tiers are used throughout (see [IMPLEMENTATION_PLAN.md § Cost optimization](IMPLEMENTATION_PLAN.md#cost-optimization--things-to-avoid)).

---

## 1. MongoDB Atlas

1. Create a free account at Atlas and create a new **free (M0) cluster** (any region close to your users, e.g. `eu-west-1` or one close to Render's region).
2. **Database Access** → add a database user (username/password, or SCRAM) — this is *not* your Atlas login, it's a separate DB credential.
3. **Network Access** → add IP access list entry `0.0.0.0/0` (allow from anywhere) — Render's IPs are dynamic on the free tier, so this is the practical option; the connection string's own username/password remains the actual access control.
4. **Database → Connect → Drivers** → copy the connection string, e.g.:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/forth-urban?retryWrites=true&w=majority`
   Replace `<user>`/`<password>`, keep the `/forth-urban` database name.
5. This full string is your `MONGODB_URI` — put it in `apps/server/.env` locally, and in Render's environment variables for Preview/Production (§3).

---

## 2. Google OAuth (optional — only if you want "Sign in with Google")

1. Go to Google Cloud Console → create/select a project.
2. **APIs & Services → OAuth consent screen** → configure (External, add your email as a test user while unverified).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → type "Web application".
4. **Authorized redirect URIs** — add one entry per environment you'll use:
   - `http://localhost:4000/api/auth/google/callback` (local)
   - `https://<your-render-service>.onrender.com/api/auth/google/callback` (production)
5. Copy the **Client ID** and **Client Secret**.
   - Server: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` (the matching redirect URI above).
   - Client: `VITE_GOOGLE_CLIENT_ID` (Client ID only — never the secret).
6. If you skip this section entirely, `/api/auth/google*` cleanly returns `503` instead of crashing (see `requireGoogleStrategy` guard in `auth.routes.ts`) — Google login is optional, not required to launch.

---

## 3. Backend — Render

1. Create a free Render account, connect your GitHub account/repo.
2. **New + → Blueprint** → select this repo. Render reads [`render.yaml`](../render.yaml) at the repo root and proposes a `forth-urban-api` web service (free plan, root dir `apps/server`, health check `/api/health`).
3. Click **Apply** to create the service. It will fail to boot the first time — that's expected, because the `sync: false` secrets in `render.yaml` are placeholders you must fill in next.
4. Open the new service → **Environment** tab → fill in every variable marked `sync: false` in `render.yaml` (full list + where to get each value: [ENVIRONMENT.md](ENVIRONMENT.md)). At minimum for the app to boot: `CORS_ALLOWED_ORIGINS`, `CLIENT_URL`, `COOKIE_DOMAIN`, `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`.
5. **Manual Deploy → Deploy latest commit** (or just wait — saving env vars auto-redeploys). Confirm `https://<service>.onrender.com/api/health` returns `{"success":true,...}`.
6. Render's free web services **spin down after 15 minutes of inactivity** and take ~30-60s to wake on the next request — acceptable for a pre-launch/low-traffic phase; revisit (paid plan) once real users depend on responsiveness.
7. **Preview environments:** Render's free plan does not include PR preview environments (that's a paid "Preview Environments" feature). For this phase, PRs are validated by the GitHub Actions CI job (lint/typecheck/test/build/e2e) instead of a live preview backend; only `main` auto-deploys to the real backend.
8. **Auto-deploy:** already configured by `render.yaml` (`autoDeploy: true`, `branch: main`) — every push to `main` (i.e. every merged PR) redeploys automatically, no extra step needed. This alone satisfies "pushing to main auto-deploys the backend" — the GitHub Actions `deploy` job's Render step (§5) is an optional extra trigger, not required.

---

## 4. Frontend — Vercel

1. Create a free Vercel account, **Add New → Project**, import this GitHub repo.
2. Vercel detects a monorepo. Set:
   - **Root Directory:** `apps/client`
   - **Framework Preset:** Vite
   - **Build Command:** leave default (`vite build` — Vercel auto-runs `pnpm install` at the repo root first because it detects `pnpm-workspace.yaml`)
   - **Output Directory:** `dist` (default)
   - If Vercel's monorepo detection doesn't install workspace deps automatically, enable **"Include files outside the Root Directory in the Build Step"** in Project Settings → General, and/or set the **Install Command** to `cd ../.. && corepack enable && pnpm install --frozen-lockfile`.
3. **Settings → Environment Variables** → add each `VITE_*` variable from [ENVIRONMENT.md](ENVIRONMENT.md), scoped to **Production**, **Preview**, and **Development** as appropriate (e.g. `VITE_API_BASE_URL` differs per scope — point Preview at either the same Render production API or a separate staging API if you create one later).
4. Deploy. Vercel gives you a `<project>.vercel.app` production URL and a unique preview URL per PR automatically (its native GitHub integration — no extra Actions config needed for this).
5. [`apps/client/vercel.json`](../apps/client/vercel.json) adds a SPA rewrite so deep links (e.g. `/dashboard` refreshed directly) resolve to `index.html` instead of 404ing — required because React Router does client-side routing.
6. Go back to Render (§3) and update `CORS_ALLOWED_ORIGINS`/`CLIENT_URL` to include the real `https://<project>.vercel.app` URL once you have it (a chicken-and-egg step: deploy the frontend first to learn its URL, then update the backend's env vars).

---

## 5. GitHub Actions deploy hooks (optional extra CI/CD gate)

Both Render and Vercel already auto-deploy from git natively (§3, §4) — you do **not** need this section for "pushing to main deploys". Only set this up if you specifically want deploys to be strictly gated behind the GitHub Actions CI job passing (lint/typecheck/test/build/e2e), rather than Render's/Vercel's own build succeeding.

1. **Render:** service → **Settings → Deploy Hook** → copy the URL.
2. **Vercel:** project → **Settings → Git → Deploy Hooks** → create one (choose the `main` branch) → copy the URL.
3. In GitHub: repo → **Settings → Secrets and variables → Actions → New repository secret**:
   - `RENDER_DEPLOY_HOOK_URL` = the Render URL from step 1.
   - `VERCEL_DEPLOY_HOOK_URL` = the Vercel URL from step 2.
4. The `deploy` job in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) already calls both hooks via `curl` on every push to `main`, after the `lint-typecheck-test-build` and `e2e` jobs pass — and silently skips any hook whose secret isn't set, so this is safe to leave unconfigured.
5. If you enable this, consider disabling Vercel's/Render's own git-push auto-deploy (Vercel: Settings → Git → toggle production branch deploys off; Render: set `autoDeploy: false` in `render.yaml`) to avoid double-deploying on every merge.

---

## 6. Resend (transactional email)

1. Create a free Resend account → **API Keys** → create one → this is `RESEND_API_KEY`.
2. Until you own a verified domain, use the sandbox sender `RESEND_FROM_EMAIL=Forth Urban <onboarding@resend.dev>` (already the default) — it can only send to your own verified Resend account email while unverified.
3. **Post client approval / custom domain** ([IMPLEMENTATION_PLAN.md Phase 10](IMPLEMENTATION_PLAN.md#phase-10--cicd--deployment)): Resend dashboard → **Domains → Add Domain** → add the DNS records (SPF/DKIM `TXT`/`CNAME`) it shows you at your domain registrar → once verified, change `RESEND_FROM_EMAIL` to e.g. `Forth Urban <hello@forthurban.ai>`.

---

## 7. Cloudinary (property media)

1. Create a free Cloudinary account. The dashboard home page shows **Cloud name**, **API Key**, **API Secret** directly — copy all three into `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET`.
2. No further setup needed — `apps/server/src/lib/cloudinary.util.ts` uses these directly; the admin property-media upload route (`POST /api/admin/properties/:id/media`) is disabled (returns a clear error) until all three are set.

---

## 8. AI providers — OpenAI (primary) + Gemini (fallback)

1. **OpenAI:** platform.openai.com → **API keys → Create new secret key** → `OPENAI_API_KEY`. Add a small billing limit/budget alert (Settings → Limits) since this is a pay-as-you-go API, not free.
2. **Gemini:** aistudio.google.com → **Get API key** → `GEMINI_API_KEY`. Gemini has a free tier with rate limits, useful as the fallback so the app degrades gracefully if OpenAI billing lapses.
3. Both are optional individually — if neither is set, `/api/ai/*` routes still respond, just using the local plain-language fallback template (`degraded: true` in the response) instead of a real LLM call. Set at least one for real AI explanations.

---

## 9. PostHog (product analytics)

1. Create a free PostHog Cloud account (US or EU region — pick one and use the matching host for `POSTHOG_HOST`/`VITE_POSTHOG_HOST`, default is US: `https://us.i.posthog.com`).
2. **Project Settings → Project API Key** → this single key is used for **both** `POSTHOG_API_KEY` (server, `posthog-node`) and `VITE_POSTHOG_KEY` (client, `posthog-js`) — same key, two env var names.

---

## 10. Sentry (error monitoring)

1. Create a free Sentry account → **Create Project** (choose Node.js for one project, React for another — recommended to keep them separate so server/client errors don't mix in one issue stream).
2. Each project's **Settings → Client Keys (DSN)** gives you a DSN URL:
   - Node project's DSN → server's `SENTRY_DSN`.
   - React project's DSN → client's `VITE_SENTRY_DSN`.
3. Both are optional/no-op if unset (see `apps/server/src/config/sentry.ts` and `apps/client/src/lib/sentry.ts`).

---

## 11. OpenAPI / Swagger UI

No manual setup — `GET /api/docs` is already live once the backend is deployed (`apps/server/src/config/openapi.ts`, mounted in `app.ts`). It's open in development/test; in production it's gated behind `requireAuth + requireRole("admin")`, so log in as an admin user and pass the access token via the Swagger UI's "Authorize" button (or a browser extension that adds the `Authorization: Bearer <token>` header) to view it in production.

---

## 12. Post client-approval: custom domain

Once the client approves moving off the free `*.vercel.app`/`*.onrender.com` URLs:

1. Buy the domain (e.g. `forthurban.ai`) at any registrar.
2. **Vercel:** project → **Settings → Domains → Add** → follow the DNS records it gives you (usually an `A`/`ALIAS` record for the apex + a `CNAME` for `www`).
3. **Render:** service → **Settings → Custom Domains → Add Custom Domain** for the API (e.g. `api.forthurban.ai`) → add the `CNAME` it shows you.
4. Update, everywhere the old URLs appear:
   - Render env: `CORS_ALLOWED_ORIGINS`, `CLIENT_URL`, `COOKIE_DOMAIN` (apex domain, e.g. `forthurban.ai`).
   - Vercel env: `VITE_API_BASE_URL` → `https://api.forthurban.ai/api`.
   - Google Cloud Console → OAuth client → Authorized redirect URIs → add `https://api.forthurban.ai/api/auth/google/callback`; update server's `GOOGLE_CALLBACK_URL` to match.
   - Resend → verify the new domain and switch `RESEND_FROM_EMAIL` to it (§6).
5. Redeploy both services after updating env vars (Render/Vercel both auto-redeploy on env var save).

---

## 13. (Recommended) GitHub branch protection

Not required for deploys to work, but recommended so `main` can't accept a broken PR before a Vercel/Render production deploy fires:

1. Repo → **Settings → Branches → Add branch protection rule** for `main` (and optionally `develop`).
2. Require the `lint-typecheck-test-build` (and optionally `e2e`) status checks to pass before merging.
3. Require PRs before merging (no direct pushes to `main`).
