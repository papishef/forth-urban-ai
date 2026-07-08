import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { registerAdmin } from "./test-helpers.js";

const validPropertyInput = {
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
};

describe("admin properties routes", () => {
  it("rejects non-admins", async () => {
    const app = createApp();
    const res = await request(app).get("/api/admin/properties");
    expect(res.status).toBe(401);
  });

  it("creates, lists, updates, and soft-deletes a property", async () => {
    const app = createApp();
    const { token } = await registerAdmin(app);

    const createRes = await request(app)
      .post("/api/admin/properties")
      .set("Authorization", `Bearer ${token}`)
      .send(validPropertyInput);
    expect(createRes.status).toBe(201);
    const propertyId = createRes.body.data.id as string;

    const listRes = await request(app).get("/api/admin/properties").set("Authorization", `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.total).toBe(1);

    const updateRes = await request(app)
      .patch(`/api/admin/properties/${propertyId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ pricePerPlot: 25_000_000 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.pricePerPlot).toBe(25_000_000);

    const deleteRes = await request(app)
      .delete(`/api/admin/properties/${propertyId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);

    const afterDeleteList = await request(app).get("/api/admin/properties").set("Authorization", `Bearer ${token}`);
    expect(afterDeleteList.body.data.total).toBe(0);
  });

  it("returns 404 for an unknown property id", async () => {
    const app = createApp();
    const { token } = await registerAdmin(app);
    const res = await request(app)
      .get("/api/admin/properties/000000000000000000000000")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("removes a media item from a property", async () => {
    const app = createApp();
    const { token } = await registerAdmin(app);

    const photoUrl = "https://res.cloudinary.com/demo/image/upload/v1700000000/properties/abc/photo1.jpg";
    const createRes = await request(app)
      .post("/api/admin/properties")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...validPropertyInput,
        media: { photos: [photoUrl], videos: [], googleMapsUrl: null, brochureUrl: null, titleDocuments: [] },
      });
    expect(createRes.status).toBe(201);
    const propertyId = createRes.body.data.id as string;
    expect(createRes.body.data.media.photos).toEqual([photoUrl]);

    const deleteRes = await request(app)
      .delete(`/api/admin/properties/${propertyId}/media`)
      .set("Authorization", `Bearer ${token}`)
      .send({ field: "photos", url: photoUrl });
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.media.photos).toEqual([]);

    const missingRes = await request(app)
      .delete(`/api/admin/properties/${propertyId}/media`)
      .set("Authorization", `Bearer ${token}`)
      .send({ field: "photos", url: photoUrl });
    expect(missingRes.status).toBe(404);
  });
});
