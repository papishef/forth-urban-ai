import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { ContactMessage } from "./contact-message.model.js";

describe("Contact Routes (Public & Admin)", () => {
  it("submits contact message and returns 201", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/contact")
      .send({
        name: "Amaka Eze",
        email: "amaka@example.com",
        phone: "+2348012345678",
        reason: "buying",
        message: "I am interested in serviced plots in Guzape II.",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const saved = await ContactMessage.findOne({ email: "amaka@example.com" });
    expect(saved).not.toBeNull();
    expect(saved?.reason).toBe("buying");
    expect(saved?.status).toBe("new");
  });

  it("handles honeypot silently without storing spam message", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/contact")
      .send({
        name: "Spam Bot",
        email: "bot@spammer.com",
        reason: "general",
        message: "Buy our random product now!",
        companyWebsite: "http://spam-link.com",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const saved = await ContactMessage.findOne({ email: "bot@spammer.com" });
    expect(saved).toBeNull();
  });

  it("fails validation when required fields are missing", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/contact")
      .send({
        name: "A",
        email: "not-an-email",
        message: "Too short",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
