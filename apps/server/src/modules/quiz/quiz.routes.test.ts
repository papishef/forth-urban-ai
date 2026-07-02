import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

describe("quiz routes", () => {
  const validHomeReadinessAnswers = {
    buyerGoal: "residential",
    budgetRange: { min: 10_000_000, max: 20_000_000 },
    monthlyIncome: 5_000_000,
    paymentStyle: "installment",
    timeline: "now",
    preferredArea: "Guzape II",
    lifestylePreference: "premiumQuiet",
    biggestFear: "locationConfusion",
    inspectionPreference: "physical",
  };

  async function registerAndGetToken(app: ReturnType<typeof createApp>) {
    const res = await request(app).post("/api/auth/register").send({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      password: "supersecret123",
    });
    return res.body.data.tokens.accessToken as string;
  }

  it("rejects quiz routes without an access token", async () => {
    const app = createApp();
    const res = await request(app).post("/api/quiz/home-readiness").send(validHomeReadinessAnswers);
    expect(res.status).toBe(401);
  });

  it("rejects an incomplete Home-Readiness Quiz submission with 400", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);

    const res = await request(app)
      .post("/api/quiz/home-readiness")
      .set("Authorization", `Bearer ${token}`)
      .send({ buyerGoal: "residential" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("submits the Home-Readiness Quiz and returns score/band/persona/next action", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);

    await request(app).post("/api/quiz/home-readiness/start").set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .post("/api/quiz/home-readiness")
      .set("Authorization", `Bearer ${token}`)
      .send(validHomeReadinessAnswers);

    expect(res.status).toBe(201);
    expect(res.body.data.score).toBe(97);
    expect(res.body.data.band).toBe("readyBuyer");
    expect(res.body.data.bandLabel).toBe("Ready Buyer");
    expect(res.body.data.persona).toBe("First-Time Ownership Builder");
    expect(res.body.data.nextAction.action).toBe("Show matched lands + inspection scheduler");
  });

  it("returns 404 for the readiness result before the quiz is completed", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);

    const res = await request(app).get("/api/quiz/home-readiness/result").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("persists the result and returns it via GET after submission", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);

    await request(app)
      .post("/api/quiz/home-readiness")
      .set("Authorization", `Bearer ${token}`)
      .send(validHomeReadinessAnswers);

    const res = await request(app).get("/api/quiz/home-readiness/result").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(97);
    expect(res.body.data.band).toBe("readyBuyer");
  });

  it("populates the profile from the quiz submission", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);

    await request(app)
      .post("/api/quiz/home-readiness")
      .set("Authorization", `Bearer ${token}`)
      .send(validHomeReadinessAnswers);

    const res = await request(app).get("/api/profiles/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.readinessScore).toBe(97);
    expect(res.body.data.buyerPersona).toBe("First-Time Ownership Builder");
    expect(res.body.data.preferredArea).toBe("Guzape II");
  });

  it("submits the Best Abuja Area Quiz and returns a recommended area + next action", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);

    const res = await request(app)
      .post("/api/quiz/area")
      .set("Authorization", `Bearer ${token}`)
      .send({ areaPreference: "affordableOwnership" });

    expect(res.status).toBe(201);
    expect(res.body.data.recommendedArea).toBe("Kuje");
    expect(res.body.data.nextAction.action).toBe("View available land in recommended area");
  });

  it("returns the latest Area Quiz result via GET", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);

    await request(app)
      .post("/api/quiz/area")
      .set("Authorization", `Bearer ${token}`)
      .send({ areaPreference: "premiumLiving" });

    const res = await request(app).get("/api/quiz/area/result").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.recommendedArea).toBe("Guzape II");
  });

  it("rejects an invalid Area Quiz answer with 400", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);

    const res = await request(app)
      .post("/api/quiz/area")
      .set("Authorization", `Bearer ${token}`)
      .send({ areaPreference: "notARealPreference" });

    expect(res.status).toBe(400);
  });
});
