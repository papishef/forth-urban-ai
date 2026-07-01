# Architecture — Forth Urban AI Property Advisor

## 1. Architectural principle: Decision Engine vs LLM Advisory Layer

The source spec repeatedly calls this an "AI Recommendation Engine," but the underlying logic — readiness scoring, affordability formulas, ROI assumptions, property matching by budget, and next-best-action selection — is **deterministic and rule-based**. This architecture splits the system into two explicit layers so the LLM never has authority over numbers or business rules.

```mermaid
flowchart LR
    subgraph Client[apps/client — React]
        UI[Quiz / Calculators / Dashboard]
    end

    subgraph Server[apps/server — Express]
        API[REST API]
        DE[Decision Engine\n(deterministic)]
        AI[LLM Advisory Layer\n(explanatory only)]
        DB[(MongoDB Atlas)]
    end

    OpenAI[OpenAI GPT-5.x]
    Anthropic[Anthropic - fallback]

    UI -->|quiz answers, calc inputs| API
    API --> DE
    DE -->|scores, matches, formulas| DB
    DE -->|structured JSON result| AI
    AI -->|natural-language explanation| API
    API -->|score + explanation| UI
    AI -.primary.-> OpenAI
    AI -.fallback on failure.-> Anthropic
```

### Decision Engine (`apps/server/src/modules/decision-engine`)

Pure, unit-tested TypeScript functions. No network calls, no LLM. Owns:

- **Readiness scoring** — weighted formula over quiz answers → score 0–100 → band (Ready/Almost Ready/Researching/Early Stage) per [PRODUCT_SPEC §5](PRODUCT_SPEC.md#5-ai-recommendation-output-decision-engine-result-explained-by-llm).
- **Affordability calculation** — `balance = price - downPayment`, `monthlyInstallment = balance / durationMonths`, ratio bands per [PRODUCT_SPEC §8](PRODUCT_SPEC.md#8-budget--installment-calculator-deterministic).
- **Hidden cost aggregation** — sums applicable line items per property's `hiddenCostRules`.
- **ROI projection** — `futureValue = price * (1+rate)^years` for conservative/moderate/optimistic, admin-editable rates.
- **Property matching** — filters/scores `properties` collection against user's budget, area, goal, timeline, lifestyle.
- **Next-best-action selection** — maps the trigger table in [PRODUCT_SPEC §6](PRODUCT_SPEC.md#6-next-best-action-engine-deterministic-rules) to a single recommended action, persisted to `nextActions`/embedded on profile.

Every function here must have a Vitest unit test with representative fixtures. This code must be swappable/testable without any external API key.

### LLM Advisory Layer (`apps/server/src/modules/ai-advisory`)

Receives the Decision Engine's structured JSON output and:

- Converts it into warm, plain-language explanations (persona narrative, "why this fits", ROI caveats, inspection prep tips).
- Answers free-form follow-up questions using the user's stored context (no vector DB needed — see §4).
- **Never** recomputes or overrides a number the Decision Engine produced. If the LLM's text disagrees with the numbers, the numbers win and the mismatch should be logged (Sentry) as a prompt bug.

Provider abstraction (single adapter, swap by config):

```ts
// packages/shared-types/src/ai.ts
export interface AIProvider {
  generate(input: {
    promptKey: string;        // e.g. "recommendation" — maps to prompts/recommendation.md
    version?: string;          // pin a prompt version if needed
    context: Record<string, unknown>; // structured JSON, never free text of secrets
    maxTokens?: number;
  }): Promise<{ text: string; provider: string; promptVersion: string }>;
}

// apps/server/src/modules/ai-advisory/providers/openai.provider.ts
export class OpenAIProvider implements AIProvider { /* GPT-5.x */ }

// apps/server/src/modules/ai-advisory/providers/anthropic.provider.ts
export class AnthropicProvider implements AIProvider { /* fallback */ }

// apps/server/src/modules/ai-advisory/ai-advisory.service.ts
export class AIAdvisoryService {
  constructor(private primary: AIProvider, private fallback: AIProvider) {}
  async generate(input: Parameters<AIProvider["generate"]>[0]) {
    try { return await this.primary.generate(input); }
    catch (err) {
      logger.warn({ err }, "primary AI provider failed, using fallback");
      return await this.fallback.generate(input);
    }
  }
}
```

Switching providers, or adding a third, means writing one new class implementing `AIProvider` — no changes to callers.

## 2. Prompt management

Prompts live as versioned Markdown in `prompts/`, never inline in code:

```
prompts/
  quiz-summary.md
  recommendation.md
  buyer-persona.md
  inspection-advice.md
  roi-explainer.md
```

Each file has YAML front-matter:

```markdown
---
key: recommendation
version: 1
model_hint: gpt-5.1
inputs: [readinessScore, buyerPersona, budgetRange, recommendedArea, mainConcern]
---
You are a calm, trustworthy Abuja property advisor...
```

The advisory service loads by `key`, logs `promptVersion` used per call (stored on the AI response record) so behavior changes are traceable. Never allow user free text to be interpolated directly into system-level instructions — only into clearly delimited "user context" sections (prompt-injection hygiene).

## 3. AI memory strategy — no vector DB

No RAG/vector database initially. Context sent to the LLM is assembled directly from Mongo documents already scoped to the user:

- Latest `quizResponses` document
- Latest `calculatorResults` (budget/hiddenCost/roi)
- `profiles` document (persona, readiness score, preferences)
- Selected/viewed `properties` (subset of fields only — never dump full inventory)

This structured-JSON-in-context approach is far cheaper than RAG and sufficient because the domain (single user's own data) is small and well-typed. Revisit only if cross-user knowledge search becomes a real requirement.

## 4. Monorepo layout

```
forth-urban-ai/
├── apps/
│   ├── client/                     # React 19 + Vite + TS
│   │   └── src/
│   │       ├── routes/             # React Router route modules
│   │       ├── features/           # quiz, calculators, dashboard, inspection, admin
│   │       ├── components/         # local components (Shadcn-based)
│   │       ├── lib/                # query client, api client, auth context
│   │       └── styles/             # Tailwind config, theme tokens
│   └── server/                     # Express + TS
│       └── src/
│           ├── modules/
│           │   ├── auth/
│           │   ├── users/
│           │   ├── quiz/
│           │   ├── decision-engine/
│           │   ├── ai-advisory/
│           │   ├── properties/
│           │   ├── inspections/
│           │   ├── crm/
│           │   ├── notifications/
│           │   └── admin/
│           ├── middleware/         # auth, error handler, rate limit, audit log
│           ├── config/             # env loading, provider selection
│           └── db/                 # mongoose connection, models
├── packages/
│   ├── shared-types/                # DTOs shared client/server
│   ├── ui/                          # Shadcn/Tailwind component library
│   └── validation/                  # Zod schemas (single source of truth)
├── prompts/                         # versioned LLM prompts
├── docs/                            # this documentation set
├── scripts/                         # seed/migration scripts
└── .github/workflows/               # CI/CD
```

## 5. Database schema (MongoDB Atlas)

Every collection includes `createdAt`, `updatedAt`, `deletedAt` (soft delete), `version`.

| Collection | Key fields |
|---|---|
| `users` | firstName, lastName, email (unique), passwordHash?, authProvider (local/google), googleId?, emailVerified, whatsappNumber, currentCity, currentCountry, isDiaspora, role (user/admin/sales), status |
| `profiles` | userId (ref), buyerGoal, budgetRange {min,max}, monthlyIncome, paymentStyle, timeline, preferredArea, lifestylePreference, biggestFear, inspectionPreference, buyerPersona, leadCategory, readinessScore |
| `quizResponses` | userId (ref), quizType (homeReadiness/area), answers[{questionKey, answer}], readinessScore, resultType, completedAt |
| `properties` | name, estateName, location {address, landmarks, lat, lng}, pricePerPlot, plotSizes[], titleType, documentationStatus, paymentPlans[], bestFitBuyerTypes[], developmentStatus, inspectionAvailability {physical, virtual}, hiddenCostRules[], roiAssumptions {conservative, moderate, optimistic}, media {photos[], videos[], googleMapsUrl, brochureUrl, titleDocuments[]}, isActive |
| `recommendations` | userId (ref), propertyId (ref), reasonTags[], score, source (quiz/areaQuiz/manual) |
| `calculatorResults` | userId (ref), type (budget/hiddenCost/roi), inputs {}, outputs {} |
| `inspectionBookings` | userId (ref), propertyId?/recommendedArea, inspectionType (physical/virtual), preferredDate, preferredTime, mainConcern, wantsDocsBeforeInspection, status (pending/confirmed/completed/cancelled), assignedSalesRep, checklist[] |
| `crmEvents` | userId (ref), eventType, payload, salesRepId?, notes[], tags[], pipelineStage |
| `emailEvents` | userId (ref), campaign, template, status (sent/opened/clicked/bounced), providerMessageId |
| `auditLogs` | actorId, actorType (user/admin/system), action, targetType, targetId, metadata, ipAddress |
| `notifications` | userId (ref), type (email/browser/sms/whatsapp), title, body, read |
| `sessions` | userId (ref), refreshTokenHash, userAgent, ip, expiresAt, revokedAt |

Indexes: `users.email` (unique), `properties.location.landmarks` (text, optional), `quizResponses.userId+completedAt`, `inspectionBookings.status+preferredDate`, `calculatorResults.userId+type`.

Full ERD lives in `docs/ERD.md` (generate via `scripts/generate-erd.ts` once models exist — see Implementation Plan Phase 1).

## 6. API surface (high level; full spec generated as OpenAPI/Swagger at `/api/docs`)

| Area | Routes |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/otp/request`, `POST /api/auth/otp/verify`, `POST /api/auth/google`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `POST /api/auth/password/forgot`, `POST /api/auth/password/reset` |
| Users/Profile | `GET/PATCH /api/users/me`, `GET/PATCH /api/profiles/me` |
| Quiz | `POST /api/quiz/home-readiness`, `GET /api/quiz/home-readiness/result`, `POST /api/quiz/area`, `GET /api/quiz/area/result` |
| Decision Engine (via composed endpoints) | `GET /api/recommendations/properties`, `POST /api/calculators/budget`, `POST /api/calculators/hidden-cost`, `POST /api/calculators/roi`, `GET /api/next-action` |
| AI Advisory | `POST /api/ai/quiz-summary`, `POST /api/ai/buyer-persona`, `POST /api/ai/recommendation-explainer`, `POST /api/ai/roi-explainer`, `POST /api/ai/inspection-advice`, `POST /api/ai/ask` |
| Properties | `GET /api/properties`, `GET /api/properties/:id` |
| Inspections | `POST /api/inspections`, `GET /api/inspections/me` |
| Events | `POST /api/events` (forwards to PostHog + `auditLogs`) |
| Admin | `/api/admin/users`, `/api/admin/leads`, `/api/admin/properties`, `/api/admin/crm`, `/api/admin/email-campaigns`, `/api/admin/prompts`, `/api/admin/roi-assumptions`, `/api/admin/hidden-costs`, `/api/admin/areas`, `/api/admin/settings` |

All responses use the consistent envelope: `{ success: boolean, message: string, data: T | null, errors: unknown[] | null }`, enforced by centralized error-handling middleware.

## 7. Event tracking (PostHog + `auditLogs`)

`account_created`, `login_completed`, `quiz_started`, `quiz_completed`, `readiness_result_viewed`, `property_recommended`, `property_saved`, `budget_calculated`, `hidden_cost_viewed`, `roi_calculated`, `area_quiz_completed`, `inspection_started`, `inspection_booked`, `report_downloaded`, `email_clicked`, `whatsapp_clicked`.

## 8. Design system

- Colors: background `#FFECE4`, brown `#5C4033`, text `#181818`.
- Headings: Manrope. Body: Inter. Icons: Lucide. Illustrations: Undraw. Charts: Chart.js.
- Style references: Notion, Stripe, Linear — applied to premium real estate (warm, minimal, rounded cards, generous whitespace, subtle glass accents only).
- Maps: Google Maps iframe initially; Maps API later.

## 9. Future scalability hooks

Design now so these don't require a rewrite later:

- **Multi-tenant (SaaS):** keep a `tenantId`/`companyId` optional field reserved on `users`, `properties`, `inspectionBookings` even if unused initially; default to a single Forth Urban tenant.
- **Multi-city/country:** `properties.location` and `profiles.preferredArea` should not assume "Abuja" in schema — keep area/city as data, not hardcoded enums, with an areas admin table driving the Area Quiz logic.
- **Additional AI providers:** enforced by the `AIProvider` interface (§1).
- **Payments (Paystack/Flutterwave):** reserve a `payments` collection/module boundary; do not couple inspection booking to payment logic.
- **CRM integrations:** `crmEvents` schema is intentionally generic (`eventType` + `payload`) so it can sync outward later without migration.
- **Agent/broker portals & mobile app APIs:** the REST API is the only integration surface (no server-rendered coupling), so a future mobile client or partner portal consumes the same `/api/*` routes.
