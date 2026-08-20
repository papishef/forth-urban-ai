import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { registerAdmin, registerSubAdmin, registerUser } from "./test-helpers.js";
import { ContactMessage } from "../contact/contact-message.model.js";

describe("admin contact-messages routes", () => {
  it("rejects unauthenticated requests", async () => {
    const app = createApp();
    const res = await request(app).get("/api/admin/contact-messages");
    expect(res.status).toBe(401);
  });

  it("rejects a regular user without an inquiries grant", async () => {
    const app = createApp();
    const { token } = await registerUser(app);
    const res = await request(app).get("/api/admin/contact-messages").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("allows a sub-admin with inquiries write access to list messages", async () => {
    const app = createApp();
    const { token } = await registerSubAdmin(app, { "contact-messages": { read: true, write: true } });

    await ContactMessage.create({
      name: "Amaka Eze",
      email: "amaka@example.com",
      reason: "buying",
      message: "Interested in Guzape II serviced plots.",
      status: "new",
    });

    const listRes = await request(app).get("/api/admin/contact-messages").set("Authorization", `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.total).toBe(1);
    expect(listRes.body.data.items[0].status).toBe("new");
  });

  it("updates a message's status", async () => {
    const app = createApp();
    const { token } = await registerAdmin(app);

    const doc = await ContactMessage.create({
      name: "Chidi Okoro",
      email: "chidi@example.com",
      reason: "general",
      message: "What are your working hours?",
      status: "new",
    });

    const patchRes = await request(app)
      .patch(`/api/admin/contact-messages/${doc._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "read" });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.status).toBe("read");
  });

  it("returns 404 for an unknown message id", async () => {
    const app = createApp();
    const { token } = await registerAdmin(app);
    const res = await request(app)
      .get("/api/admin/contact-messages/000000000000000000000000")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
