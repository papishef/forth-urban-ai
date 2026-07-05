import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { Property } from "../properties/property.model.js";

describe("ai-advisory routes", () => {
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

  async function registerAndGetToken(app: ReturnType<typeof createApp>) {
    const res = await request(app).post("/api/auth/register").send({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      password: "supersecret123",
    });
    return res.body.data.tokens.accessToken as string;
  }

  async function completeQuiz(app: ReturnType<typeof createApp>, token: string) {
    await request(app)
      .post("/api/quiz/home-readiness")
      .set("Authorization", `Bearer ${token}`)
      .send(validHomeReadinessAnswers);
  }

  async function seedProperty() {
    return Property.create({
      name: "Forth Urban Residency",
      estateName: "Forth Urban Residency",
      location: { address: "Kuje, Abuja", landmarks: ["Kuje Market"], lat: null, lng: null },
      pricePerPlot: 15_000_000,
      plotSizes: ["500sqm"],
      titleType: "Governor's Consent",
      documentationStatus: "Registered Survey",
      paymentPlans: [{ type: "installment", label: "12 months", minDownPaymentPercent: 30, maxDurationMonths: 12 }],
      bestFitBuyerTypes: ["firstTime"],
      developmentStatus: "developing",
      inspectionAvailability: { physical: true, virtual: true },
      hiddenCostRules: [{ key: "surveyFee", label: "Survey Fee", amount: 150_000, applicable: true }],
      roiAssumptions: { conservative: 0.05, moderate: 0.1, optimistic: 0.15 },
      media: { photos: [], videos: [], googleMapsUrl: null, brochureUrl: null, titleDocuments: [] },
      isActive: true,
    });
  }

  // No OPENAI_API_KEY/GEMINI_API_KEY are configured in this test environment,
  // so every call below exercises the full fallback chain down to the local
  // plain-language template — proving the "never block the user" exit
  // criterion without needing network mocking or real secrets.

  it("rejects ai-advisory routes without an access token", async () => {
    const app = createApp();
    const res = await request(app).post("/api/ai/quiz-summary").send({});
    expect(res.status).toBe(401);
  });

  it("returns 404 for quiz-summary before the Home-Readiness Quiz is completed", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);

    const res = await request(app).post("/api/ai/quiz-summary").set("Authorization", `Bearer ${token}`).send({});
    expect(res.status).toBe(404);
  });

  it("generates a quiz-summary explanation (degraded to template, no keys configured)", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);
    await completeQuiz(app, token);

    const res = await request(app).post("/api/ai/quiz-summary").set("Authorization", `Bearer ${token}`).send({});

    expect(res.status).toBe(201);
    expect(res.body.data.promptKey).toBe("quiz-summary");
    expect(res.body.data.provider).toBe("template");
    expect(res.body.data.degraded).toBe(true);
    expect(typeof res.body.data.text).toBe("string");
    expect(res.body.data.text.length).toBeGreaterThan(0);
  });

  it("generates a buyer-persona explanation", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);
    await completeQuiz(app, token);

    const res = await request(app).post("/api/ai/buyer-persona").set("Authorization", `Bearer ${token}`).send({});

    expect(res.status).toBe(201);
    expect(res.body.data.promptKey).toBe("buyer-persona");
    expect(res.body.data.text.length).toBeGreaterThan(0);
  });

  it("validates recommendation-explainer input and 404s for an unknown property", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);
    await completeQuiz(app, token);

    const badReq = await request(app)
      .post("/api/ai/recommendation-explainer")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(badReq.status).toBe(400);

    const notFound = await request(app)
      .post("/api/ai/recommendation-explainer")
      .set("Authorization", `Bearer ${token}`)
      .send({ propertyId: "000000000000000000000000" });
    expect(notFound.status).toBe(404);
  });

  it("generates a recommendation explanation for a matched property", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);
    const property = await seedProperty();
    await completeQuiz(app, token);
    await request(app).get("/api/recommendations/properties").set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .post("/api/ai/recommendation-explainer")
      .set("Authorization", `Bearer ${token}`)
      .send({ propertyId: property._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.data.promptKey).toBe("recommendation");
    expect(res.body.data.text).toContain("Forth Urban Residency");
  });

  it("generates a roi-explainer explanation using Decision Engine numbers, independent of any prior calculator run", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);
    const property = await seedProperty();

    const res = await request(app)
      .post("/api/ai/roi-explainer")
      .set("Authorization", `Bearer ${token}`)
      .send({ propertyId: property._id.toString(), years: 5, scenario: "moderate" });

    expect(res.status).toBe(201);
    expect(res.body.data.promptKey).toBe("roi-explainer");
    expect(res.body.data.text).toContain("educational purposes only");
  });

  it("generates inspection-advice referencing the fixed PRODUCT_SPEC checklist", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);
    const property = await seedProperty();
    await completeQuiz(app, token);

    const res = await request(app)
      .post("/api/ai/inspection-advice")
      .set("Authorization", `Bearer ${token}`)
      .send({ propertyId: property._id.toString(), inspectionType: "physical" });

    expect(res.status).toBe(201);
    expect(res.body.data.promptKey).toBe("inspection-advice");
    expect(res.body.data.text).toContain("Forth Urban Residency");
  });

  it("validates the ask endpoint's input and requires a completed profile", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);

    const badReq = await request(app).post("/api/ai/ask").set("Authorization", `Bearer ${token}`).send({ question: "" });
    expect(badReq.status).toBe(400);

    const noProfile = await request(app)
      .post("/api/ai/ask")
      .set("Authorization", `Bearer ${token}`)
      .send({ question: "What is my readiness score?" });
    expect(noProfile.status).toBe(404);
  });

  it("answers a follow-up question using the user's own stored context", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);
    await completeQuiz(app, token);

    const res = await request(app)
      .post("/api/ai/ask")
      .set("Authorization", `Bearer ${token}`)
      .send({ question: "What is my readiness score?" });

    expect(res.status).toBe(201);
    expect(res.body.data.promptKey).toBe("ask");
    expect(res.body.data.text.length).toBeGreaterThan(0);
  });
});
