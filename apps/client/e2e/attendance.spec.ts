import { test, expect } from "@playwright/test";

test.describe("Attendance System E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/kiosk");
  });

  test("should complete full check-in and check-out flow", async ({ page }) => {
    // Step 1: Welcome screen
    expect(await page.getByText("Forth Urban").isVisible()).toBeTruthy();
    expect(
      await page.getByRole("button", { name: /check in/i }).isVisible()
    ).toBeTruthy();

    // Step 2: Click CHECK IN
    await page.getByRole("button", { name: /check in/i }).click();

    // Step 3: Select type (Visitor)
    await page.getByRole("button", { name: /visitor/i }).click();

    // Step 4: Fill visitor form
    await page.fill('input[placeholder*="Name"]', "John Doe");
    await page.fill('input[type="email"]', "john@example.com");
    await page.fill('input[type="tel"]', "+234801234567");

    // Step 5: Select purpose
    const purposeSelect = page.locator('select');
    await purposeSelect.selectOption("property-inspection");

    // Step 6: Submit
    await page.getByRole("button", { name: /check in/i }).click();

    // Step 7: Verify success
    await expect(page.getByText(/successfully checked in/i)).toBeVisible();

    // Step 8: Auto-reset and return to welcome
    await page.waitForTimeout(4000); // Wait for auto-reset timer
    expect(
      await page.getByRole("button", { name: /check in/i }).isVisible()
    ).toBeTruthy();
  });

  test("should allow staff check-in with search", async ({ page }) => {
    // Click CHECK IN
    await page.getByRole("button", { name: /check in/i }).click();

    // Select Staff
    await page.getByRole("button", { name: /staff/i }).click();

    // Search for staff
    const searchInput = page.locator('input[placeholder*="search"]');
    await searchInput.fill("John");

    // Wait for results and select
    await page.waitForTimeout(500);
    const staffOption = page.locator("text=John Doe").first();
    await staffOption.click();

    // Submit
    await page.getByRole("button", { name: /check in/i }).click();

    // Verify success
    await expect(page.getByText(/successfully checked in/i)).toBeVisible();
  });

  test("should allow check-out flow", async ({ page }) => {
    // Click CHECK OUT
    await page.getByRole("button", { name: /check out/i }).click();

    // Search for open log
    const searchInput = page.locator('input[placeholder*="search"]');
    await searchInput.fill("John");

    // Wait for results and select
    await page.waitForTimeout(500);
    const logOption = page.locator("text=John").first();
    await logOption.click();

    // Add optional notes
    const notesField = page.locator('textarea');
    if (await notesField.isVisible()) {
      await notesField.fill("Meeting completed successfully");
    }

    // Submit
    await page.getByRole("button", { name: /check out/i }).click();

    // Verify success with duration
    await expect(
      page.getByText(/stay time: \d+ minutes/i)
    ).toBeVisible();
  });

  test("admin should view attendance logs", async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto("http://localhost:5173/admin/attendance");

    // Verify page loaded
    await expect(page.getByText(/Attendance/i)).toBeVisible();

    // Verify tabs are present
    await expect(page.getByRole("button", { name: /Logs/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Staff/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Analytics/i })
    ).toBeVisible();
  });

  test("admin should filter logs by type", async ({ page }) => {
    await page.goto("http://localhost:5173/admin/attendance");

    // Wait for logs table to load
    await page.waitForTimeout(500);

    // Find type filter
    const typeFilter = page.locator('select').first();
    await typeFilter.selectOption("staff");

    // Verify filter was applied
    await page.waitForTimeout(500);
    expect(await typeFilter.inputValue()).toBe("staff");
  });

  test("admin should view analytics dashboard", async ({ page }) => {
    await page.goto("http://localhost:5173/admin/attendance");

    // Click Analytics tab
    await page.getByRole("button", { name: /Analytics/i }).click();

    // Verify analytics elements
    await expect(
      page.getByText(/peak hour/i, { exact: false })
    ).toBeVisible();
    await expect(
      page.getByText(/no-show rate/i, { exact: false })
    ).toBeVisible();
    await expect(
      page.getByText(/daily trend/i, { exact: false })
    ).toBeVisible();
  });

  test("admin should view anomalies", async ({ page }) => {
    await page.goto("http://localhost:5173/admin/attendance");

    // Click Anomalies tab
    await page.getByRole("button", { name: /Anomalies/i }).click();

    // Verify anomalies section is present
    await expect(page.getByText(/Anomalies/i)).toBeVisible();
  });

  test("admin should download report", async ({ page }) => {
    await page.goto("http://localhost:5173/admin/attendance");

    // Click Reports tab
    await page.getByRole("button", { name: /Reports/i }).click();

    // Verify report cards are visible
    await expect(
      page.getByText(/Monthly Summary/i, { exact: false })
    ).toBeVisible();
    await expect(
      page.getByText(/No-Show Report/i, { exact: false })
    ).toBeVisible();

    // Start waiting for download
    const downloadPromise = page.waitForEvent("download");

    // Click download button
    const downloadButtons = page.getByRole("button", {
      name: /Download CSV/i,
    });
    await downloadButtons.first().click();

    // Verify download started
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("attendance");
  });

  test("should add new staff member", async ({ page }) => {
    await page.goto("http://localhost:5173/admin/attendance");

    // Click Staff tab
    await page.getByRole("button", { name: /Staff/i }).click();

    // Click Add Staff button
    await page.getByRole("button", { name: /Add Staff/i }).click();

    // Fill form
    await page.fill('input[placeholder*="First"]', "Jane");
    await page.fill('input[placeholder*="Last"]', "Smith");
    await page.fill('input[type="email"]', "jane@example.com");
    await page.fill('input[type="tel"]', "+234801234567");

    // Select department
    const deptSelect = page.locator("select").nth(0);
    await deptSelect.selectOption("sales");

    // Select role
    const roleSelect = page.locator("select").nth(1);
    await roleSelect.selectOption("agent");

    // Submit
    await page.getByRole("button", { name: /Create/i }).click();

    // Verify success (could show toast or add to table)
    await page.waitForTimeout(500);
    expect(
      await page.getByText(/Jane Smith/i, { exact: false }).isVisible()
    ).toBeTruthy();
  });

  test("should handle off-hours check-in anomaly", async ({ page }) => {
    // Navigate to kiosk
    await page.goto("http://localhost:5173/kiosk");

    // Intercept API to mock off-hours time
    await page.context().addCookies([
      {
        name: "test-time",
        value: "03:00", // 3 AM
        url: "http://localhost:5173",
      },
    ]);

    // Complete check-in as before
    await page.getByRole("button", { name: /check in/i }).click();
    await page.getByRole("button", { name: /visitor/i }).click();
    await page.fill('input[placeholder*="Name"]', "John Doe");
    await page.fill('input[type="email"]', "john@example.com");
    await page.fill('input[type="tel"]', "+234801234567");
    await page.getByRole("button", { name: /check in/i }).click();

    // Navigate to admin anomalies
    await page.goto("http://localhost:5173/admin/attendance");
    await page.getByRole("button", { name: /Anomalies/i }).click();

    // Verify off-hours anomaly is detected
    await expect(
      page.getByText(/off.hours|early.morning/i)
    ).toBeVisible();
  });
});
