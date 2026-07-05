# Testing Guide

This project has four test layers, in line with [docs/IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md#phase-9--testing--qa-hardening). All four run in CI on every PR (`.github/workflows/ci.yml`).

| Layer | Tool | Location | Scope |
|---|---|---|---|
| 1. Unit | Vitest | `apps/server/src/modules/**/*.test.ts` | Decision Engine (deterministic scoring/matching/calculator math) — enforced at ≥90% coverage |
| 2. Component | Vitest + React Testing Library | `apps/client/src/features/**/*.test.tsx` | Quiz flow, calculators, auth forms |
| 3. Integration | Vitest + Supertest | `apps/server/src/modules/**/*.route.test.ts` (and similar) | Auth, quiz, calculators, inspections, AI endpoints (mocked provider), recommendation engine |
| 4. E2E + accessibility | Playwright + axe-core | `apps/client/e2e/*.spec.ts` | Full funnel (landing → account → quiz → recommendation → calculators → inspection booking) + WCAG AA scan |

## 1–2. Unit & component tests (Vitest)

```bash
# everything (server + client), via Turborepo
pnpm test

# a single package
pnpm --filter server exec vitest run
pnpm --filter client exec vitest run

# watch mode while developing
pnpm --filter client exec vitest
```

Client tests use `@testing-library/react` with `globals: false` — every test file must import `describe/it/expect` explicitly, and `src/test/setup.ts` runs `afterEach(() => cleanup())`.

Server tests spin up an in-memory MongoDB (`mongodb-memory-server`) once per file in `src/test/setup.ts` (`beforeAll`/`afterAll`, 15 min timeout for the first download) and truncate all collections after every test. `apps/server/vitest.config.ts` sets `fileParallelism: false` because multiple in-memory Mongo instances in parallel is slow/flaky on constrained CI runners.

### Decision Engine coverage gate

The Decision Engine (`apps/server/src/modules/decision-engine`) is the one place a numeric bug would be a real product/financial risk, so it has an enforced coverage floor:

```bash
pnpm --filter server run test:coverage -- src/modules/decision-engine
```

`apps/server/vitest.config.ts` fails the run if statements/branches/functions/lines drop below 90% for that module. CI runs this as a dedicated step so a coverage regression fails the build independently of whether the tests themselves pass.

## 3. Integration tests (Supertest)

Server route tests boot the real Express `app` (no `listen()`) and hit it with Supertest against the in-memory Mongo instance described above. AI Advisory routes mock the OpenAI/Anthropic adapter — no real LLM calls happen in tests. Run them the same way as unit tests: `pnpm --filter server exec vitest run`.

## 4. End-to-end funnel + accessibility (Playwright)

Location: `apps/client/e2e/`.

- `mocks.ts` — a single `installApiMocks(page)` helper that intercepts every `**/api/**` request via `page.route()` and returns canned, schema-accurate JSON (matching the real `{success, message, data}` envelope and the DTOs in `packages/shared-types`). There is no dedicated E2E backend/MongoDB environment — the four layers above already cover the API contracts, so E2E only needs to prove the client wires screens and navigation together correctly.
- `funnel.spec.ts` — walks the full funnel: landing → register → Home-Readiness Quiz (all 9 steps) → result → recommended properties → property detail → budget calculator → hidden-cost calculator → inspection booking (the app's single conversion event).
- `accessibility.spec.ts` — uses `@axe-core/playwright`'s `AxeBuilder` to scan landing, register, login, dashboard, and the quiz page against WCAG 2.1 A/AA tags, asserting **zero `critical`-impact violations**.

`playwright.config.ts` runs against a **production build** (`webServer` runs `vite build && vite preview` on port 5173, not `vite dev`) with two projects: `mobile-chrome` (Pixel 7 viewport, default/primary — most funnel traffic is mobile per [AGENTS.md](../AGENTS.md#8-rules-ai-agents-must-follow-in-this-repo)) and `desktop-chrome`.

> **Why a production build, not the dev server?** React StrictMode's dev-only
> effect double-invoke simulation (mount → effect → simulated unmount →
> remount) can orphan an in-flight `useMutation` fired from a `useEffect`
> (e.g. the Hidden Cost calculator's auto-run-on-mount calculation) — the
> remount creates a fresh mutation observer that never sees the original
> request resolve, so the UI hangs on a loading state forever. This never
> happens for real users (StrictMode's double-invoke is stripped in
> production), so testing against `vite preview` instead of `vite dev`
> avoids the false failure and better matches what ships.

### Running locally

```bash
# one-time: download the Chromium browser binary Playwright drives
pnpm --filter client exec playwright install --with-deps chromium

# headless run (same as CI)
pnpm --filter client exec playwright test

# headed / debug
pnpm --filter client exec playwright test --headed
pnpm --filter client exec playwright test --ui

# view the HTML report from the last run
pnpm --filter client exec playwright show-report
```

Or via the package scripts: `pnpm --filter client run e2e:install` then `pnpm --filter client run e2e`.

### CI

The `e2e` job in `.github/workflows/ci.yml` runs after the main `lint-typecheck-test-build` job passes: install deps → `playwright install --with-deps chromium` → `playwright test` (headless by default) → upload the HTML report as a build artifact on failure (or always, for inspection).

## Adding new tests

- New Decision Engine logic → unit test in the same module folder, keep the 90% threshold green.
- New API route → Zod schema in `packages/validation` + Supertest test + OpenAPI entry (per [AGENTS.md](../AGENTS.md#5-rules-ai-agents-must-follow-in-this-repo) rule 4).
- New client page with a form or multi-step flow → an RTL test using `MemoryRouter`; mock the page's `*-api.ts` module and `react-router-dom`'s `useNavigate`.
- New funnel step → extend `apps/client/e2e/mocks.ts` with the new endpoint(s) and add the corresponding steps to `funnel.spec.ts`.

## Known testing gotchas

- **Native HTML5 validation can swallow form submission silently.** If a `<form>` has an `<input min=/max=/required>` but is missing the `noValidate` attribute, the browser blocks the `submit` event before React Hook Form/Zod ever run — no error is shown, the submit handler is never called. Always add `noValidate` to forms validated by RHF/Zod.
- **`fireEvent.change` over `userEvent.clear()+type()` for `type="number"` inputs** — more reliable under jsdom.
- **Mock `framer-motion` in RTL tests** that use `AnimatePresence`/exit animations — jsdom has no real animation-frame timing, so exit-then-enter transitions don't resolve deterministically, leaving stale content in the DOM. Mock `AnimatePresence` and `motion.*` to render children immediately.
- **`useMutation().mutate()` fired from a `useEffect` on mount can hang forever under `vite dev` + React StrictMode** (see the callout above) — this is why Playwright tests run against a production build. If you add a new "auto-run on mount" mutation, either keep testing it via Playwright against the production build, or add a component test that doesn't rely on real StrictMode double-invoke timing.
