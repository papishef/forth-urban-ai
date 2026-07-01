# AGENTS.md — Forth Urban AI Property Advisor

This file orients any human or AI coding agent working in this repository. Read this first. Deeper detail lives in [docs/](docs/PRODUCT_SPEC.md).

## 1. What this repo builds

The **Forth Urban AI Property Advisor** — an AI-assisted, account-gated real estate consultation funnel for Abuja land sales. Users create a free profile, take a readiness quiz, get matched properties, run budget/hidden-cost/ROI calculators, and are guided to book a physical or virtual **land inspection** (the single conversion event). Every screen must surface one recommended next action. Full functional spec: [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md).

## 2. Core architectural rule — read before touching recommendation/calculator code

The system has **two strictly separated layers**:

| Layer | Responsibility | Must be |
|---|---|---|
| **Decision Engine** (`apps/server/src/modules/decision-engine`) | Readiness scoring, affordability ratio, ROI math, property matching, next-best-action selection | Deterministic, pure functions, unit-tested, no LLM calls |
| **LLM Advisory Layer** (`apps/server/src/modules/ai-advisory`) | Turns Decision Engine output into empathetic natural-language explanations; answers free-form follow-up questions | Stateless w.r.t. business logic, provider-swappable, never asked to compute numbers |

**Non-negotiable:** the LLM never calculates ROI, budget, installments, hidden costs, or readiness scores. It only explains numbers the Decision Engine already computed. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#decision-engine-vs-llm-advisory-layer).

## 3. Tech stack (do not substitute without updating docs/ARCHITECTURE.md)

- **Monorepo:** pnpm workspaces + Turborepo
- **Frontend:** React 19, Vite, TypeScript, React Router, TanStack Query, React Hook Form, Zod, Framer Motion, Shadcn UI, Tailwind CSS, Lucide Icons
- **State:** React Context + TanStack Query only — **no Redux**
- **Backend:** Express, Node LTS, TypeScript, Mongoose, JWT (access + refresh), Passport (Google OAuth only)
- **DB:** MongoDB Atlas (free tier)
- **Email:** Resend
- **WhatsApp:** `wa.me` click-to-chat links only — **no Meta Cloud API, no WhatsApp OTP** (cost)
- **AI:** OpenAI (primary) with Anthropic (fallback) behind a single adapter interface
- **Files:** Cloudinary
- **Analytics:** PostHog
- **Monitoring:** Sentry
- **Logging:** Pino (not Winston)
- **Validation:** Zod, shared between client/server via `packages/validation`
- **Testing:** Vitest, React Testing Library, Supertest, Playwright
- **CI/CD:** GitHub Actions → Vercel (client) + Render (server)

**Explicitly avoid until scale demands it:** Redis, a vector DB/RAG, Kubernetes, Docker Swarm, RabbitMQ, microservices, ElasticSearch. See [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md#cost-optimization--things-to-avoid).

## 4. Repository layout

```
forth-urban-ai/
├── apps/
│   ├── client/          # React 19 + Vite frontend
│   └── server/          # Express + TS backend
├── packages/
│   ├── shared-types/    # Shared TS interfaces/DTOs (User, Property, QuizResult, ...)
│   ├── ui/              # Shared Shadcn/Tailwind component library
│   └── validation/      # Shared Zod schemas (single source of truth for shapes)
├── prompts/             # Versioned LLM prompt templates (never hardcode prompts in code)
├── docs/                # Architecture, ERD, API, deployment, guides
├── scripts/             # Seed data, migrations, maintenance scripts
└── .github/workflows/   # CI/CD
```

## 5. Rules AI agents must follow in this repo

1. **Never hardcode prompts.** All LLM prompts live as versioned Markdown files in `prompts/` and are loaded at runtime. See `prompts/` list in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#prompt-management).
2. **Never let the LLM do arithmetic that affects business decisions.** Financial/scoring math is Decision Engine code, covered by unit tests.
3. **Every Mongoose schema** gets `createdAt`, `updatedAt`, `deletedAt`, `version` — no hard deletes.
4. **Every new API route** must have a Zod schema in `packages/validation`, a Supertest test, and an OpenAPI entry.
5. **Every user-facing result screen** must include an explicit "next recommended action" component — this is a product requirement, not optional UI.
6. **Security defaults on:** Helmet, rate limiting, CORS allow-list, bcrypt for passwords, HTTP-only cookies for refresh tokens, CSRF protection on cookie-authenticated routes, upload MIME/size validation, audit log entries for admin actions.
7. **Design tokens are fixed:** background `#FFECE4`, brown `#5C4033`, text `#181818`; headings in Manrope, body in Inter; Lucide icons; Chart.js for charts; Undraw for illustrations. Style: warm, premium, minimal, generous whitespace, rounded cards, subtle glass accents only.
8. **Mobile-first.** Most traffic arrives from Instagram/Facebook/WhatsApp/Google on mobile.
9. **Multi-tenant-ready naming.** Don't hardcode "Abuja" or a single company assumption into core schemas/logic where a `city`/`country`/`tenantId`-style field would cost little now and save a rewrite later (see [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md#future-scalability-hooks)).

## 6. Where to go next

- Functional/product requirements: [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md)
- Technical architecture, data flow, schema, API surface: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Phased build plan with exit criteria: [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)

Original product PDF: `Forth Urban Ai Property Consultation System (2).pdf` (kept for reference; `docs/PRODUCT_SPEC.md` is the canonical, agent-readable version of it).
