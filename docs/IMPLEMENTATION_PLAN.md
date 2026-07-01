# Implementation Plan — Forth Urban AI Property Advisor

This is the phased build plan for the repo described in [AGENTS.md](../AGENTS.md), implementing the spec in [PRODUCT_SPEC.md](PRODUCT_SPEC.md) using the architecture in [ARCHITECTURE.md](ARCHITECTURE.md). Each phase lists goals, key tasks, and exit criteria so an agent (or developer) can pick up any phase independently once prior phases are done.

## Guiding principles

- Ship the **Decision Engine before the LLM layer** — deterministic logic must work and be tested standalone.
- No tool is a dead end — every phase that adds a user-facing screen must include its "next recommended action."
- Cost-optimize: free tiers everywhere until real usage demands otherwise (§ Cost Optimization below).
- Everything typed end-to-end: Zod schema → shared type → API contract → OpenAPI doc.

---

## Phase 0 — Repo bootstrap & tooling

**Goal:** a working monorepo skeleton with linting, formatting, and CI wired up, before any feature code.

Tasks:
- Initialize pnpm workspace + Turborepo (`pnpm-workspace.yaml`, `turbo.json`).
- Scaffold `apps/client` (Vite + React 19 + TS), `apps/server` (Express + TS), `packages/shared-types`, `packages/ui`, `packages/validation`.
- Root tooling: ESLint (shared config), Prettier, TypeScript project references, Husky + lint-staged pre-commit.
- `prompts/` folder with placeholder files listed in [ARCHITECTURE.md §2](ARCHITECTURE.md#2-prompt-management).
- `.env.example` files per app (see Environment Variables below) — never commit real secrets.
- GitHub Actions workflow skeleton: `lint`, `typecheck`, `test`, `build` on PR; branch strategy `main` / `develop` / `feature/*` with PRs required into `develop`, `develop` → `main` for releases.

Exit criteria: `pnpm install && pnpm build` succeeds from root; CI green on an empty PR; both apps boot locally (`pnpm dev`) showing placeholder pages.

---

## Phase 1 — Foundation: auth, data layer, design system

Tasks:
- **Backend:** Mongoose connection module with retry/backoff; base models for `users`, `sessions` with the shared audit fields (`createdAt/updatedAt/deletedAt/version`); Pino logger; centralized error middleware returning the `{success,message,data,errors}` envelope; Helmet, CORS allow-list, rate limiting (express-rate-limit) wired globally.
- **Auth module:** register (email+password), login, JWT access token (short-lived) + refresh token (HTTP-only cookie), logout/session revocation, email OTP request/verify (via Resend), Google OAuth via Passport, forgot/reset password. Passwords hashed with bcrypt. CSRF protection on cookie-based refresh endpoint.
- **Frontend:** Tailwind config with the fixed theme tokens (`#FFECE4`, `#5C4033`, `#181818`, `#ffffff`), Manrope/Inter fonts, Shadcn UI installed, base layout, auth pages (login/register/OTP), TanStack Query client + Axios/fetch wrapper with auto-refresh-on-401, React Context for auth/session state, Animate the UI aesthetically.
- **Shared:** Zod schemas for register/login/OTP in `packages/validation`, mirrored types in `packages/shared-types`.

Exit criteria: a user can register, verify OTP or use Google login, log in, stay logged in across refresh, and log out; Supertest covers all auth routes; RTL covers login/register forms; audit log entries created for auth events.

---

## Phase 2 — Core funnel: profile, quiz, Decision Engine

Tasks:
- Models: `profiles`, `quizResponses`.
- Decision Engine module (pure functions, no I/O): readiness scoring formula + band mapping, next-best-action selector — implement exactly the tables in [PRODUCT_SPEC §5–6](PRODUCT_SPEC.md#5-ai-recommendation-output-decision-engine-result-explained-by-llm). 100% unit-tested with Vitest using fixture answer sets for each band.
- Quiz API: submit Home-Readiness Quiz answers → persist → run Decision Engine → return score/band/persona/next action.
- Best Abuja Area Quiz: same pattern, separate `quizType`.
- Frontend: one-question-per-screen quiz UI with progress indicator ("Step X of 10"), result screen with readiness score card + highlighted "next recommended action" card, dashboard shell to resume tools.
- Event tracking: `quiz_started`, `quiz_completed`, `readiness_result_viewed` → PostHog + `auditLogs`.

Exit criteria: full quiz flow works end-to-end without any LLM call yet; scoring is deterministic and covered by tests; abandonment can be detected (quiz started but not completed within X time) for later email nurture (Phase 6).

---

## Phase 3 — Property inventory & recommendation/matching engine

Tasks:
- `properties` model with all fields from [ARCHITECTURE.md §5](ARCHITECTURE.md#5-database-schema-mongodb-atlas); Cloudinary integration for photos/videos/brochure/title docs uploads with MIME/size validation.
- Property matching logic in Decision Engine: filter/score by budget, preferred area, buyer goal, timeline, lifestyle, payment style.
- `recommendations` model to persist which properties were shown to which user and why (`reasonTags`).
- API: `GET /api/recommendations/properties`, `GET /api/properties`, `GET /api/properties/:id`.
- Frontend: property recommendation cards ("Recommended for You... Next step: View Payment Breakdown"), property detail page (photos/video/map/brochure).
- Seed script (`scripts/seed-properties.ts`) with sample Abuja properties across areas mentioned in the spec (Kuje, Lugbe, Guzape II, Lokogoma).

Exit criteria: quiz result flows into a populated recommendation list; property detail page renders all media; admin-agnostic (no admin UI yet, seed-driven).

---

## Phase 4 — Calculators (Budget, Hidden Cost, ROI) — deterministic only

Tasks:
- `calculatorResults` model.
- Decision Engine functions: budget/affordability (`balance`, `monthlyInstallment`, ratio bands), hidden cost aggregation from a property's `hiddenCostRules`, ROI projection (conservative/moderate/optimistic) with admin-editable default rates (stored in a `settings`/`roiAssumptions` doc, not hardcoded).
- API: `POST /api/calculators/budget`, `POST /api/calculators/hidden-cost`, `POST /api/calculators/roi`.
- Frontend: three calculator screens/components, each ending in a highlighted next-action card per the routing rules in [PRODUCT_SPEC §9–10](PRODUCT_SPEC.md#9-hidden-cost-guide) (first-time buyer → checklist first; investor → ROI first).
- Unit tests covering every affordability band and ROI scenario with known inputs/outputs.

Exit criteria: all three calculators produce mathematically correct, tested results with zero LLM involvement; disclaimers rendered verbatim from spec.

---

## Phase 5 — LLM Advisory Layer

Tasks:
- Implement `AIProvider` interface + `OpenAIProvider` + `AnthropicProvider` + `AIAdvisoryService` fallback wrapper exactly as sketched in [ARCHITECTURE.md §1](ARCHITECTURE.md#llm-advisory-layer-appsserversrcmodulesai-advisory).
- Prompt loader that reads versioned Markdown from `prompts/`, parses front-matter, validates required `inputs` are present in context before calling the provider.
- Write the five prompts: `quiz-summary.md`, `recommendation.md`, `buyer-persona.md`, `inspection-advice.md`, `roi-explainer.md` — each takes only structured JSON context (readiness score, persona, budget range, property reasonTags, ROI numbers), never asks the model to compute anything.
- API: `POST /api/ai/quiz-summary`, `/buyer-persona`, `/recommendation-explainer`, `/roi-explainer`, `/inspection-advice`, and a general `/ask` endpoint for follow-up questions scoped to the user's own stored context (no cross-user data, no vector DB).
- Frontend: swap static explanation text for AI-generated copy in result screens; loading/error states with graceful fallback to a plain-language template if both providers fail (never block the user from seeing their numbers).
- Sentry instrumentation around AI calls to catch provider failures and log prompt/version used.

Exit criteria: every calculator/quiz result screen shows an AI-generated explanation layered on top of Decision Engine numbers; provider fallback verified by forcing the primary to fail in a test; numbers displayed always match Decision Engine output regardless of LLM text.

---

## Phase 6 — Inspection scheduler, notifications, lightweight CRM

Tasks:
- `inspectionBookings` model + API (`POST /api/inspections`, `GET /api/inspections/me`) implementing the auto-generated checklist from [PRODUCT_SPEC §11](PRODUCT_SPEC.md#11-site-inspection-scheduler-the-conversion-event).
- Email via Resend: booking confirmation, quiz-abandonment reminder, segment-based nurture templates (Hot/Warm/Research/Diaspora/Budget starter/Investor) using React Email or MJML templates, triggered from `emailEvents`.
- WhatsApp: generate `wa.me` click-to-chat deep links pre-filled with a message referencing the user's result/inspection — no Meta Cloud API yet.
- `crmEvents` model + minimal pipeline (stage, tags, notes, assigned sales rep) — intentionally lightweight, not a full CRM.
- Browser notifications (basic Notification API) for logged-in users; `notifications` model for in-app feed.

Exit criteria: booking an inspection persists data, sends a confirmation email, generates a wa.me link, creates a CRM pipeline entry, and notifies sales (email/notification); abandoned-quiz reminder email fires on a scheduled job (node-cron or Render cron job — no message queue needed at this scale).

---

## Phase 7 — Admin dashboard

Tasks (frontend `apps/client` under an `/admin` route guarded by `role=admin`, backend `modules/admin`):
- Users list/detail, Properties CRUD (with Cloudinary uploads), Quiz analytics (funnel drop-off, band distribution charts via Chart.js), Inspection bookings management (status changes, reassignment), lightweight CRM board (pipeline/kanban-style), Email campaign view (sent/opened/clicked via `emailEvents`), ROI assumptions editor (writes to the settings doc consumed by Decision Engine — no redeploy needed to change rates), Hidden cost rules editor per property, Area management (drives the Area Quiz logic instead of hardcoded areas), Property matching rule weights, Lead pipeline view, System/audit logs viewer, Admin user management, general Settings.
- AI prompt editor: view/edit prompt Markdown + version bump, with a preview call against a sample context before publishing.

Exit criteria: an admin can, without a code deploy, add a property, change ROI default rates, edit a prompt version, and see the funnel analytics reflecting Phase 1–6 data.

---

## Phase 8 — Analytics & monitoring

Tasks:
- PostHog integrated client + server side for the full event list in [ARCHITECTURE.md §7](ARCHITECTURE.md#7-event-tracking-posthog--auditlogs).
- Sentry for both `apps/client` and `apps/server`, including LLM failure capture from Phase 5.
- Pino structured logging with request IDs; log level via env var per environment.

Exit criteria: a funnel drop-off report (quiz started vs completed vs recommendation viewed vs inspection booked) is viewable in PostHog; a deliberately thrown error appears in Sentry for both apps.

---

## Phase 9 — Testing & QA hardening

Tasks:
- Vitest unit coverage target for Decision Engine ≥ 90% (pure functions, easy to hit).
- React Testing Library coverage for quiz flow, calculators, auth forms.
- Supertest integration coverage for auth, quiz, calculators, inspections, AI endpoints (mock providers), recommendation engine.
- Playwright E2E: full funnel from landing → account creation → quiz → recommendation → calculators → inspection booking, on mobile viewport primarily.
- Accessibility pass: keyboard navigation, ARIA labels, contrast check against the fixed palette, focus states — target WCAG AA.

Exit criteria: CI runs all four test layers on every PR; Playwright funnel test passes headless in CI; an axe-core (or equivalent) accessibility check runs in CI with no critical violations.

---

## Phase 10 — CI/CD & deployment

Tasks:
- GitHub Actions: `lint → typecheck → unit test → integration test → build` on PR to `develop`/`main`; deploy job triggers on merge to `main`.
- Frontend deploy to Vercel (preview deployments per PR, production on `main`), using `.vercel.app` domain until client approval.
- Backend deploy to Render (web service), MongoDB Atlas free cluster, Cloudinary, Resend — all via environment variables injected per environment (Development/Preview/Production), never hardcoded.
- OpenAPI/Swagger UI generated from route annotations, served at `/api/docs` in non-production or behind admin auth in production.
- Post client approval: purchase and wire up a custom domain (e.g. `forthurban.ai`), update CORS allow-list, OAuth redirect URIs, Resend sender domain verification.

Exit criteria: pushing to `main` auto-deploys both apps; preview URLs work per PR; environment variables documented in `docs/ENVIRONMENT.md` with no secrets committed.

---

## Phase 11 — Performance & security hardening (pre-launch)

Tasks:
- Performance: image optimization + lazy loading (Cloudinary transformations), route-level code splitting, pagination on properties/leads/admin lists, gzip/br compression, Mongo indexes per [ARCHITECTURE.md §5](ARCHITECTURE.md#5-database-schema-mongodb-atlas), debounced search inputs. Caching only via HTTP cache headers / TanStack Query cache — no Redis yet.
- Security checklist re-verification: Helmet headers, rate limiting on auth/AI endpoints specifically (cost control), CORS allow-list locked to real domains, input sanitization on all free-text fields (esp. anything reaching an LLM prompt — prompt-injection hygiene per [ARCHITECTURE.md §2](ARCHITECTURE.md#2-prompt-management)), upload validation (type/size/virus-scan-if-available), audit logs reviewed for admin actions, HTTP-only + `SameSite` cookies, CSRF tokens on state-changing cookie-authenticated routes.

Exit criteria: Lighthouse mobile score in an acceptable range (define target with client, e.g. ≥ 85 performance/accessibility); a basic OWASP-oriented review (this checklist) signed off before go-live.

---

## Phase 12 — Post-launch scalability roadmap (not built now, just not blocked)

Documented, not implemented, until real demand:
- Multi-tenant/SaaS support via the reserved `tenantId` fields (§ Architecture Future Scalability Hooks).
- Multi-city/multi-country via data-driven areas instead of enum assumptions (already true if Phase 7's Area management is built correctly).
- Additional AI providers via the `AIProvider` interface.
- Payment gateway (Paystack/Flutterwave) as a new `modules/payments` boundary, not entangled with inspection booking.
- Advanced CRM integrations via the generic `crmEvents` schema.
- Mobile app / partner APIs consuming the existing REST surface.
- Agent/broker portals as a new role + route guard, reusing existing auth.

---

## Cost optimization — things to avoid

Do not introduce Redis, a vector database/RAG, Kubernetes, Docker Swarm, RabbitMQ, microservices, or ElasticSearch until real usage (thousands of users / measurable bottleneck) justifies the operational cost. Use free tiers (MongoDB Atlas, Cloudinary, Resend, PostHog self-host or free cloud tier, Sentry free tier, Vercel, Render) through staging and initial launch.

## Environment variables (names only — see `.env.example` per app, no secrets in this doc)

Per environment (Development / Preview / Production), each app needs its own `.env`:

**`apps/server`:** `NODE_ENV`, `PORT`, `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `POSTHOG_API_KEY`, `SENTRY_DSN`, `CORS_ALLOWED_ORIGINS`, `COOKIE_DOMAIN`.

**`apps/client`:** `VITE_API_BASE_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_POSTHOG_KEY`, `VITE_SENTRY_DSN`.

## Documentation to keep current as phases complete

- `docs/ERD.md` — generated entity relationship diagram once models are final (Phase 1–3).
- `docs/API.md` / auto-generated OpenAPI at `/api/docs` (Phase 10).
- `docs/DEPLOYMENT.md` — step-by-step for Vercel/Render/Atlas setup (Phase 10).
- `docs/ADMIN_GUIDE.md` — how to use the admin dashboard (Phase 7).
- `docs/DEVELOPER_GUIDE.md` — local setup, scripts, conventions (Phase 0–1).
- `docs/TESTING_GUIDE.md` — how to run each test layer (Phase 9).
- `docs/USER_MANUAL.md` — end-user facing walkthrough of the funnel (post-Phase 6).

These are deliverables of their respective phases, not written upfront.
