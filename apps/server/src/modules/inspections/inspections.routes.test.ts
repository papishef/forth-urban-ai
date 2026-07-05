import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { Property } from "../properties/property.model.js";
import { InspectionBooking } from "./inspection-booking.model.js";
import { EmailEvent } from "../notifications/email-event.model.js";
import { Notification } from "../notifications/notification.model.js";
import { CrmEvent } from "../crm/crm-event.model.js";

describe("inspections routes", () => {
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

  async function seedProperty() {
    return Property.create({
      name: "Forth Urban Residency",
      estateName: "Forth Urban Residency",
      location: { address: "Kuje, Abuja", landmarks: [], lat: null, lng: null },
      pricePerPlot: 20_000_000,
      plotSizes: ["500sqm"],
      titleType: "Governor's Consent",
      documentationStatus: "Registered Survey",
      paymentPlans: [],
      bestFitBuyerTypes: ["firstTime"],
      developmentStatus: "developing",
      inspectionAvailability: { physical: true, virtual: true },
      hiddenCostRules: [],
      roiAssumptions: { conservative: 0.05, moderate: 0.1, optimistic: 0.15 },
      media: { photos: [], videos: [], googleMapsUrl: null, brochureUrl: null, titleDocuments: [] },
      isActive: true,
    });
  }

  const validBookingInput = {
    inspectionType: "physical",
    preferredDate: "2026-08-01",
    preferredTime: "10:00",
    mainConcern: "hiddenCosts",
    wantsDocsBeforeInspection: true,
  };

  it("rejects inspection routes without an access token", async () => {
    const app = createApp();
    const res = await request(app).post("/api/inspections").send(validBookingInput);
    expect(res.status).toBe(401);
  });

  it("rejects a booking with neither propertyId nor recommendedArea", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);

    const res = await request(app)
      .post("/api/inspections")
      .set("Authorization", `Bearer ${token}`)
      .send(validBookingInput);

    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown property", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);

    const res = await request(app)
      .post("/api/inspections")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...validBookingInput, propertyId: "000000000000000000000000" });

    expect(res.status).toBe(404);
  });

  it("books an inspection by propertyId, generates a checklist + wa.me link, and persists side effects", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);
    const property = await seedProperty();

    // Establish a lead category first (Phase 2 quiz) so the CRM sales-angle path is exercised too.
    await request(app)
      .post("/api/quiz/home-readiness")
      .set("Authorization", `Bearer ${token}`)
      .send(validHomeReadinessAnswers);

    const res = await request(app)
      .post("/api/inspections")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...validBookingInput, propertyId: property._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.checklist.length).toBe(8);
    expect(res.body.data.whatsappLink).toContain("https://wa.me/");
    expect(res.body.data.nextAction.trigger).toBe("inspectionBooked");

    const persistedBooking = await InspectionBooking.findOne({ propertyId: property._id });
    expect(persistedBooking).not.toBeNull();

    const emailEvents = await EmailEvent.find({});
    const campaigns = emailEvents.map((e) => e.campaign);
    expect(campaigns).toContain("inspection-booking-confirmation");
    expect(campaigns).toContain("sales-inspection-alert");

    const notifications = await Notification.find({});
    expect(notifications.some((n) => n.title === "Inspection booking received")).toBe(true);

    const crmEvents = await CrmEvent.find({ eventType: "inspection.booked" });
    expect(crmEvents.length).toBe(1);
    expect(crmEvents[0]!.pipelineStage).toBe("inspectionScheduled");
    expect((crmEvents[0]!.payload as Record<string, unknown>).salesAngle).toBeTruthy();
  });

  it("books an inspection by recommendedArea when no property is selected", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);

    const res = await request(app)
      .post("/api/inspections")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...validBookingInput, recommendedArea: "Lugbe" });

    expect(res.status).toBe(201);
    expect(res.body.data.recommendedArea).toBe("Lugbe");
    expect(res.body.data.propertyId).toBeNull();
  });

  it("lists the user's own bookings via GET /me, most recent first", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);

    await request(app)
      .post("/api/inspections")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...validBookingInput, recommendedArea: "Lugbe" });

    const res = await request(app).get("/api/inspections/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].recommendedArea).toBe("Lugbe");
  });
});
