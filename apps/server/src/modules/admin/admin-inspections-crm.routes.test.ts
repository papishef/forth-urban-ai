import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { registerAdmin, registerUser } from "./test-helpers.js";
import { CrmEvent } from "../crm/crm-event.model.js";

const validBookingInput = {
  inspectionType: "physical",
  preferredDate: "2026-08-01",
  preferredTime: "10:00",
  mainConcern: "hiddenCosts",
  wantsDocsBeforeInspection: true,
};

describe("admin inspections routes", () => {
  it("lists inspection bookings with joined user/property info and updates status", async () => {
    const app = createApp();
    const { token: adminToken } = await registerAdmin(app);
    const { token: userToken } = await registerUser(app, { email: "buyer5@example.com" });

    const bookingRes = await request(app)
      .post("/api/inspections")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ ...validBookingInput, recommendedArea: "Lugbe" });
    expect(bookingRes.status).toBe(201);
    const bookingId = bookingRes.body.data.id as string;

    const listRes = await request(app).get("/api/admin/inspections").set("Authorization", `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.total).toBe(1);
    expect(listRes.body.data.items[0].user.email).toBe("buyer5@example.com");

    const patchRes = await request(app)
      .patch(`/api/admin/inspections/${bookingId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "confirmed" });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.status).toBe("confirmed");
  });

  it("rejects non-admins from the inspections board", async () => {
    const app = createApp();
    const { token } = await registerUser(app);
    const res = await request(app).get("/api/admin/inspections").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe("admin crm routes", () => {
  it("shows a lead's latest event on the board and appends (not mutates) on update", async () => {
    const app = createApp();
    const { token: adminToken } = await registerAdmin(app);
    const { token: userToken, userId } = await registerUser(app, { email: "lead1@example.com" });

    await request(app)
      .post("/api/inspections")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ ...validBookingInput, recommendedArea: "Lugbe" });

    const boardRes = await request(app).get("/api/admin/crm").set("Authorization", `Bearer ${adminToken}`);
    expect(boardRes.status).toBe(200);
    const leadRow = boardRes.body.data.find((row: { userId: string }) => row.userId === userId);
    expect(leadRow).toBeTruthy();
    expect(leadRow.pipelineStage).toBe("inspectionScheduled");

    const patchRes = await request(app)
      .patch(`/api/admin/crm/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ pipelineStage: "qualified", addNote: "Called the lead, very interested." });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.pipelineStage).toBe("qualified");
    expect(patchRes.body.data.notes).toContain("Called the lead, very interested.");

    const eventsForUser = await CrmEvent.find({ userId }).sort({ createdAt: 1 });
    expect(eventsForUser.length).toBe(2);
    expect(eventsForUser[0]!.pipelineStage).toBe("inspectionScheduled");
    expect(eventsForUser[1]!.pipelineStage).toBe("qualified");
  });
});
