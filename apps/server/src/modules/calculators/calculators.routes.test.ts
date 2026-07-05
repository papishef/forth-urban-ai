import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { Property } from "../properties/property.model.js";
import { CalculatorResult } from "./calculator-result.model.js";

describe("calculators routes", () => {
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

  async function registerAndGetToken(app: ReturnType<typeof createApp>, overrides: Record<string, unknown> = {}) {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        password: "supersecret123",
        ...overrides,
      });
    return res.body.data.tokens.accessToken as string;
  }

  async function seedProperty() {
    return Property.create({
      name: "Forth Urban Residency",
      estateName: "Forth Urban Residency",
      location: { address: "Kuje, Abuja", landmarks: ["Kuje Market"], lat: null, lng: null },
      pricePerPlot: 20_000_000,
      plotSizes: ["500sqm"],
      titleType: "Governor's Consent",
      documentationStatus: "Registered Survey",
      paymentPlans: [{ type: "installment", label: "24 months", minDownPaymentPercent: 25, maxDurationMonths: 24 }],
      bestFitBuyerTypes: ["firstTime", "investment"],
      developmentStatus: "developing",
      inspectionAvailability: { physical: true, virtual: true },
      hiddenCostRules: [
        { key: "surveyFee", label: "Survey Fee", amount: 150_000, applicable: true },
        { key: "legalFee", label: "Legal/Documentation Fee", amount: 250_000, applicable: true },
        { key: "allocationFee", label: "Allocation Fee", amount: 100_000, applicable: false },
      ],
      roiAssumptions: { conservative: 0.05, moderate: 0.1, optimistic: 0.15 },
      media: { photos: [], videos: [], googleMapsUrl: null, brochureUrl: null, titleDocuments: [] },
      isActive: true,
    });
  }

  it("rejects calculator routes without an access token", async () => {
    const app = createApp();
    const res = await request(app).post("/api/calculators/budget").send({});
    expect(res.status).toBe(401);
  });

  describe("POST /api/calculators/budget", () => {
    it("returns a validation error for a missing propertyId", async () => {
      const app = createApp();
      const token = await registerAndGetToken(app);

      const res = await request(app)
        .post("/api/calculators/budget")
        .set("Authorization", `Bearer ${token}`)
        .send({ downPayment: 1000, installmentDurationMonths: 12, monthlyIncome: 500_000 });

      expect(res.status).toBe(400);
    });

    it("returns 404 for an unknown property", async () => {
      const app = createApp();
      const token = await registerAndGetToken(app);

      const res = await request(app)
        .post("/api/calculators/budget")
        .set("Authorization", `Bearer ${token}`)
        .send({
          propertyId: "000000000000000000000000",
          downPayment: 1_000_000,
          installmentDurationMonths: 12,
          monthlyIncome: 500_000,
        });

      expect(res.status).toBe(404);
    });

    it("rejects a down payment greater than the property price", async () => {
      const app = createApp();
      const token = await registerAndGetToken(app);
      const property = await seedProperty();

      const res = await request(app)
        .post("/api/calculators/budget")
        .set("Authorization", `Bearer ${token}`)
        .send({
          propertyId: property._id.toString(),
          downPayment: 25_000_000,
          installmentDurationMonths: 12,
          monthlyIncome: 500_000,
        });

      expect(res.status).toBe(400);
    });

    it("computes balance/monthlyInstallment/affordabilityBand and persists a calculatorResult", async () => {
      const app = createApp();
      const token = await registerAndGetToken(app);
      const property = await seedProperty();

      const res = await request(app)
        .post("/api/calculators/budget")
        .set("Authorization", `Bearer ${token}`)
        .send({
          propertyId: property._id.toString(),
          downPayment: 5_000_000,
          installmentDurationMonths: 24,
          monthlyIncome: 3_000_000,
          includeHiddenCosts: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.balance).toBe(15_000_000);
      expect(res.body.data.monthlyInstallment).toBeCloseTo(625_000);
      expect(res.body.data.affordabilityBand).toBe("comfortable");
      expect(res.body.data.nextAction.action).toBe("View hidden costs");

      const persisted = await CalculatorResult.findOne({ type: "budget" });
      expect(persisted).not.toBeNull();
    });

    it("folds the hidden cost total into the balance when includeHiddenCosts is true", async () => {
      const app = createApp();
      const token = await registerAndGetToken(app);
      const property = await seedProperty();

      const res = await request(app)
        .post("/api/calculators/budget")
        .set("Authorization", `Bearer ${token}`)
        .send({
          propertyId: property._id.toString(),
          downPayment: 5_000_000,
          installmentDurationMonths: 24,
          monthlyIncome: 3_000_000,
          includeHiddenCosts: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.hiddenCostTotal).toBe(400_000);
      expect(res.body.data.balance).toBe(15_400_000);
    });
  });

  describe("POST /api/calculators/hidden-cost", () => {
    it("sums only applicable hidden cost rules and shows the disclaimer", async () => {
      const app = createApp();
      const token = await registerAndGetToken(app);
      const property = await seedProperty();

      const res = await request(app)
        .post("/api/calculators/hidden-cost")
        .set("Authorization", `Bearer ${token}`)
        .send({ propertyId: property._id.toString() });

      expect(res.status).toBe(201);
      expect(res.body.data.total).toBe(400_000);
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.disclaimer).toContain("educational estimate");
    });

    it("routes first-time buyers to the inspection checklist first (PRODUCT_SPEC §9)", async () => {
      const app = createApp();
      const token = await registerAndGetToken(app);
      const property = await seedProperty();

      await request(app)
        .post("/api/quiz/home-readiness")
        .set("Authorization", `Bearer ${token}`)
        .send(validHomeReadinessAnswers);

      const res = await request(app)
        .post("/api/calculators/hidden-cost")
        .set("Authorization", `Bearer ${token}`)
        .send({ propertyId: property._id.toString() });

      expect(res.status).toBe(201);
      expect(res.body.data.nextAction.action).toBe("View inspection checklist");
    });

    it("routes investors to the ROI projection first (PRODUCT_SPEC §9)", async () => {
      const app = createApp();
      const token = await registerAndGetToken(app);
      const property = await seedProperty();

      await request(app)
        .post("/api/quiz/home-readiness")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...validHomeReadinessAnswers, buyerGoal: "investment" });

      const res = await request(app)
        .post("/api/calculators/hidden-cost")
        .set("Authorization", `Bearer ${token}`)
        .send({ propertyId: property._id.toString() });

      expect(res.status).toBe(201);
      expect(res.body.data.nextAction.action).toBe("Run ROI projection");
    });
  });

  describe("POST /api/calculators/roi", () => {
    it("returns a validation error for a non-positive years input", async () => {
      const app = createApp();
      const token = await registerAndGetToken(app);
      const property = await seedProperty();

      const res = await request(app)
        .post("/api/calculators/roi")
        .set("Authorization", `Bearer ${token}`)
        .send({ propertyId: property._id.toString(), years: 0 });

      expect(res.status).toBe(400);
    });

    it("computes conservative/moderate/optimistic scenarios using the property's own roiAssumptions", async () => {
      const app = createApp();
      const token = await registerAndGetToken(app);
      const property = await seedProperty();

      const res = await request(app)
        .post("/api/calculators/roi")
        .set("Authorization", `Bearer ${token}`)
        .send({ propertyId: property._id.toString(), years: 5 });

      expect(res.status).toBe(201);
      expect(res.body.data.scenarios.conservative.rate).toBe(0.05);
      expect(res.body.data.scenarios.moderate.rate).toBe(0.1);
      expect(res.body.data.scenarios.optimistic.rate).toBe(0.15);
      expect(res.body.data.scenarios.moderate.futureValue).toBeCloseTo(20_000_000 * Math.pow(1.1, 5), 2);
      expect(res.body.data.nextAction.action).toBe("Book inspection");
      expect(res.body.data.disclaimer).toContain("educational purposes only");
    });
  });
});
