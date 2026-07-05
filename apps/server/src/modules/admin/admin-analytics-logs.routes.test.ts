import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { registerAdmin, registerUser } from "./test-helpers.js";

const validHomeReadinessAnswers = {
  buyerGoal: "firstTime",
  budgetRange: { min: 10_000_000, max: 20_000_000 },
  monthlyIncome: 3_000_000,
  paymentStyle: "installment",
  timeline: "now",
  preferredArea: "Kuje",
  lifestylePreference: "affordableStarter",
  biggestFear: "hiddenCosts",
  inspectionPreference: "physical",
};

describe("admin analytics + logs routes", () => {
  it("reflects quiz funnel/readiness-band/lead-category data after a completed quiz", async () => {
    const app = createApp();
    const { token: adminToken } = await registerAdmin(app);
    const { token: userToken } = await registerUser(app, { email: "analytics-user@example.com" });

    await request(app).post("/api/quiz/home-readiness/start").set("Authorization", `Bearer ${userToken}`).send();
    await request(app)
      .post("/api/quiz/home-readiness")
      .set("Authorization", `Bearer ${userToken}`)
      .send(validHomeReadinessAnswers);

    const res = await request(app).get("/api/admin/analytics/quiz").set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const homeReadinessFunnel = res.body.data.funnels.find((f: { quizType: string }) => f.quizType === "homeReadiness");
    expect(homeReadinessFunnel.started).toBe(1);
    expect(homeReadinessFunnel.completed).toBe(1);
    expect(homeReadinessFunnel.completionRate).toBe(1);
    expect(res.body.data.readinessBandDistribution.reduce((sum: number, b: { count: number }) => sum + b.count, 0)).toBe(1);
    expect(res.body.data.leadCategoryDistribution.reduce((sum: number, c: { count: number }) => sum + c.count, 0)).toBe(1);
    expect(res.body.data.inspectionsBooked).toBe(0);
  });

  it("lists paginated audit logs, filterable by action", async () => {
    const app = createApp();
    const { token: adminToken } = await registerAdmin(app);
    const { token: userToken } = await registerUser(app, { email: "logs-user@example.com" });

    await request(app)
      .post("/api/quiz/home-readiness")
      .set("Authorization", `Bearer ${userToken}`)
      .send(validHomeReadinessAnswers);

    const res = await request(app)
      .get("/api/admin/logs?action=quiz.completed")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.items.every((log: { action: string }) => log.action === "quiz.completed")).toBe(true);
  });

  it("rejects non-admins from analytics and logs", async () => {
    const app = createApp();
    const { token } = await registerUser(app);
    const analyticsRes = await request(app).get("/api/admin/analytics/quiz").set("Authorization", `Bearer ${token}`);
    const logsRes = await request(app).get("/api/admin/logs").set("Authorization", `Bearer ${token}`);
    expect(analyticsRes.status).toBe(403);
    expect(logsRes.status).toBe(403);
  });
});
