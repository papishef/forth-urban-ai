import { defineConfig, devices } from "@playwright/test";

/**
 * Phase 9 (docs/IMPLEMENTATION_PLAN.md#phase-9--testing--qa-hardening) —
 * end-to-end funnel + accessibility checks. These run against the real
 * client dev server with every `/api/**` network call intercepted via
 * `page.route()` (see e2e/mocks.ts) rather than a real backend/MongoDB —
 * there is no dedicated E2E environment/service yet (Phase 10), and the
 * Decision Engine/API contracts are already covered by server-side
 * Supertest integration tests. Mobile viewport is primary per the spec
 * ("most traffic arrives ... on mobile" — AGENTS.md §8).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Build + preview (a production-like build), not `vite dev`: React
    // StrictMode's dev-only effect double-invoke simulation (mount -> effect
    // -> simulated unmount -> remount) can orphan an in-flight mutation
    // fired from a `useEffect` (e.g. the auto-run Hidden Cost calculator),
    // since remounting recreates the mutation observer — a dev-only
    // artifact that never happens for real users in production. Testing
    // against the real production build avoids this and better matches
    // what ships.
    command: "pnpm exec vite build && pnpm exec vite preview --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
