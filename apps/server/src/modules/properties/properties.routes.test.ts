import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { Property } from "./property.model.js";
import { Recommendation } from "./recommendation.model.js";

describe("properties & recommendations routes", () => {
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

  async function seedProperties() {
    const fits = await Property.create({
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
      media: { photos: ["https://example.com/photo.jpg"], videos: [], googleMapsUrl: null, brochureUrl: null, titleDocuments: [] },
      isActive: true,
    });

    const doesNotFit = await Property.create({
      name: "Guzape II Premium Estate",
      estateName: "Guzape II Premium Estate",
      location: { address: "Guzape II, Abuja", landmarks: [], lat: null, lng: null },
      pricePerPlot: 90_000_000,
      plotSizes: ["1000sqm"],
      titleType: "Certificate of Occupancy",
      documentationStatus: "Fully Documented",
      paymentPlans: [{ type: "oneTime", label: "Outright", minDownPaymentPercent: null, maxDurationMonths: null }],
      bestFitBuyerTypes: ["investment"],
      developmentStatus: "serviced",
      inspectionAvailability: { physical: true, virtual: false },
      hiddenCostRules: [],
      roiAssumptions: { conservative: 0.05, moderate: 0.1, optimistic: 0.15 },
      media: { photos: [], videos: [], googleMapsUrl: null, brochureUrl: null, titleDocuments: [] },
      isActive: true,
    });

    const inactive = await Property.create({
      name: "Delisted Estate",
      estateName: "Delisted Estate",
      location: { address: "Lugbe, Abuja", landmarks: [], lat: null, lng: null },
      pricePerPlot: 12_000_000,
      plotSizes: ["500sqm"],
      titleType: "Excision",
      documentationStatus: "Title in Progress",
      paymentPlans: [],
      bestFitBuyerTypes: ["firstTime"],
      developmentStatus: "planned",
      inspectionAvailability: { physical: false, virtual: true },
      hiddenCostRules: [],
      roiAssumptions: { conservative: 0.05, moderate: 0.1, optimistic: 0.15 },
      media: { photos: [], videos: [], googleMapsUrl: null, brochureUrl: null, titleDocuments: [] },
      isActive: false,
    });

    return { fits, doesNotFit, inactive };
  }

  it("rejects properties routes without an access token", async () => {
    const app = createApp();
    const res = await request(app).get("/api/properties");
    expect(res.status).toBe(401);
  });

  it("lists only active properties", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);
    const { fits, doesNotFit, inactive } = await seedProperties();

    const res = await request(app).get("/api/properties").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const ids = res.body.data.map((p: { id: string }) => p.id);
    expect(ids).toEqual(expect.arrayContaining([fits._id.toString(), doesNotFit._id.toString()]));
    expect(ids).not.toContain(inactive._id.toString());
  });

  it("returns 404 for an unknown property id", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);

    const res = await request(app)
      .get("/api/properties/000000000000000000000000")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("returns a property with its next-best-action", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);
    const { fits } = await seedProperties();

    const res = await request(app)
      .get(`/api/properties/${fits._id.toString()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.property.name).toBe("Forth Urban Residency");
    expect(res.body.data.nextAction.action).toBe("Calculate payment breakdown");
  });

  it("returns 404 for recommendations before the Home-Readiness Quiz is completed", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);

    const res = await request(app).get("/api/recommendations/properties").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("returns matched, scored, reason-tagged properties and persists recommendations", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);
    const { fits, doesNotFit } = await seedProperties();

    await request(app)
      .post("/api/quiz/home-readiness")
      .set("Authorization", `Bearer ${token}`)
      .send(validHomeReadinessAnswers);

    const res = await request(app).get("/api/recommendations/properties").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const ids = res.body.data.map((r: { property: { id: string } }) => r.property.id);
    expect(ids).toContain(fits._id.toString());
    expect(ids).not.toContain(doesNotFit._id.toString());

    const best = res.body.data.find((r: { property: { id: string } }) => r.property.id === fits._id.toString());
    expect(best.reasonTags).toContain("Matches your budget");
    expect(best.score).toBeGreaterThan(0);

    const persisted = await Recommendation.findOne({ propertyId: fits._id.toString() });
    expect(persisted).not.toBeNull();
    expect(persisted!.source).toBe("quiz");
  });
});
