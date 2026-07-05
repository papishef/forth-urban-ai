import { test, expect } from "@playwright/test";
import { installApiMocks, PROPERTY_ID, type MockState } from "./mocks";

/**
 * Full funnel E2E test (docs/IMPLEMENTATION_PLAN.md Phase 9): landing ->
 * account creation -> Home-Readiness Quiz -> recommendation -> calculators
 * -> inspection booking. Runs primarily on a mobile viewport (see
 * playwright.config.ts's default "mobile-chrome" project).
 */
test("full funnel: register through inspection booking", async ({ page }) => {
  const state: MockState = { hasCompletedQuiz: false };
  await installApiMocks(page, state);

  // Landing -> register
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /forth urban ai property advisor/i })).toBeVisible();
  await page.getByRole("link", { name: /get started/i }).click();

  await expect(page).toHaveURL(/\/register$/);
  await page.getByLabel("First name").fill("Jane");
  await page.getByLabel("Last name").fill("Doe");
  await page.getByLabel("Email").fill("jane.e2e@example.com");
  await page.getByLabel(/^password$/i).fill("supersecret1");
  await page.getByRole("button", { name: /create account/i }).click();

  // Dashboard -> start Home-Readiness Quiz
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("link", { name: /start home-readiness quiz/i }).click();

  await expect(page).toHaveURL(/\/quiz\/home-readiness$/);

  async function nextStep() {
    await page.getByRole("button", { name: /^next$/i }).click();
  }

  await expect(page.getByText(/step 1 of 9/i)).toBeVisible();
  await page.getByRole("radio", { name: /somewhere to live/i }).check();
  await nextStep();

  await expect(page.getByText(/step 2 of 9/i)).toBeVisible();
  await page.getByLabel(/minimum/i).fill("1000000");
  await page.getByLabel(/maximum/i).fill("5000000");
  await nextStep();

  await expect(page.getByText(/step 3 of 9/i)).toBeVisible();
  await page.getByLabel(/monthly income/i).fill("300000");
  await nextStep();

  await expect(page.getByText(/step 4 of 9/i)).toBeVisible();
  await page.getByRole("radio", { name: /one-time payment/i }).check();
  await nextStep();

  await expect(page.getByText(/step 5 of 9/i)).toBeVisible();
  await page.getByRole("radio", { name: /right now/i }).check();
  await nextStep();

  await expect(page.getByText(/step 6 of 9/i)).toBeVisible();
  await page.getByLabel(/area you're considering/i).fill("Kuje");
  await nextStep();

  await expect(page.getByText(/step 7 of 9/i)).toBeVisible();
  await page.getByRole("radio", { name: /family-friendly/i }).check();
  await nextStep();

  await expect(page.getByText(/step 8 of 9/i)).toBeVisible();
  await page.getByRole("radio", { name: /^affordability$/i }).check();
  await nextStep();

  await expect(page.getByText(/step 9 of 9/i)).toBeVisible();
  await page.getByRole("radio", { name: /physical site inspection/i }).check();
  await page.getByRole("button", { name: /see my result/i }).click();

  // Quiz result -> matched properties
  await expect(page).toHaveURL(/\/quiz\/home-readiness\/result$/);
  await expect(page.getByText(/72\/100/)).toBeVisible();
  await page.getByRole("button", { name: /view matched properties/i }).click();

  await expect(page).toHaveURL(/\/properties\/recommended$/);
  await page.getByRole("link", { name: /view property/i }).click();

  // Property detail -> Budget calculator
  await expect(page).toHaveURL(new RegExp(`/properties/${PROPERTY_ID}$`));
  await page.getByRole("button", { name: /^continue$/i }).click();

  await expect(page).toHaveURL(new RegExp(`/calculators/budget/${PROPERTY_ID}$`));
  await page.getByLabel(/down payment/i).fill("1000000");
  await page.getByLabel(/monthly income/i).fill("300000");
  await page.getByRole("button", { name: /^calculate$/i }).click();
  await expect(page.getByText(/review hidden costs/i)).toBeVisible();
  await page.getByRole("button", { name: /^continue$/i }).click();

  // Hidden cost calculator (runs automatically) -> ROI calculator
  await expect(page).toHaveURL(new RegExp(`/calculators/hidden-cost/${PROPERTY_ID}$`));
  await expect(page.getByText(/review roi scenarios/i)).toBeVisible();
  await page.getByRole("button", { name: /^continue$/i }).click();

  // ROI calculator -> inspection booking
  await expect(page).toHaveURL(new RegExp(`/calculators/roi/${PROPERTY_ID}$`));
  await page.getByRole("button", { name: /run projection/i }).click();
  await expect(page.getByText(/book an inspection/i)).toBeVisible();
  await page.getByRole("button", { name: /^continue$/i }).click();

  // Inspection booking — the funnel's conversion event
  await expect(page).toHaveURL(new RegExp(`/inspections/book\\?propertyId=${PROPERTY_ID}$`));
  await page.getByLabel(/preferred date/i).fill("2026-08-01");
  await page.getByLabel(/preferred time/i).fill("10:00");
  await page.getByLabel(/whatsapp number/i).fill("+2348012345678");
  await page.getByRole("button", { name: /book inspection/i }).click();

  await expect(page.getByText(/we've got your request/i)).toBeVisible();
  await expect(page.getByText(/confirm the c of o/i)).toBeVisible();
  await page.getByRole("button", { name: /go to dashboard/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
