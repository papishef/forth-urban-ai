import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installApiMocks, type MockState } from "./mocks";

/**
 * Accessibility pass (docs/IMPLEMENTATION_PLAN.md Phase 9): axe-core scan
 * across key funnel screens, target WCAG 2.1 AA, zero *critical* violations
 * (serious/moderate/minor issues are tracked but don't fail the build here —
 * see the assertion below).
 */
const WCAG_AA_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

function criticalViolations(results: Awaited<ReturnType<AxeBuilder["analyze"]>>) {
  return results.violations.filter((v) => v.impact === "critical");
}

test.describe("accessibility (axe-core, WCAG AA)", () => {
  test("landing page has no critical violations", async ({ page }) => {
    await installApiMocks(page);
    await page.goto("/");
    const results = await new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze();
    expect(criticalViolations(results)).toEqual([]);
  });

  test("register page has no critical violations", async ({ page }) => {
    await installApiMocks(page);
    await page.goto("/register");
    const results = await new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze();
    expect(criticalViolations(results)).toEqual([]);
  });

  test("login page has no critical violations", async ({ page }) => {
    await installApiMocks(page);
    await page.goto("/login");
    const results = await new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze();
    expect(criticalViolations(results)).toEqual([]);
  });

  test("dashboard and quiz pages have no critical violations", async ({ page }) => {
    const state: MockState = { hasCompletedQuiz: false };
    await installApiMocks(page, state);

    await page.goto("/register");
    await page.getByLabel("First name").fill("Jane");
    await page.getByLabel("Last name").fill("Doe");
    await page.getByLabel("Email").fill("jane.e2e@example.com");
    await page.getByLabel(/^password$/i).fill("supersecret1");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    const dashboardResults = await new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze();
    expect(criticalViolations(dashboardResults)).toEqual([]);

    await page.getByRole("link", { name: /start home-readiness quiz/i }).click();
    await expect(page).toHaveURL(/\/quiz\/home-readiness$/);
    const quizResults = await new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze();
    expect(criticalViolations(quizResults)).toEqual([]);
  });
});
