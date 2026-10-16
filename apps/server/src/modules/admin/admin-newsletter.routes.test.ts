import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { registerAdmin, registerUser } from "./test-helpers.js";
import { NewsletterSubscriber } from "../newsletter/newsletter-subscriber.model.js";

describe("admin newsletter routes", () => {
  it("rejects unauthenticated requests", async () => {
    const app = createApp();
    const res = await request(app).get("/api/admin/newsletter");
    expect(res.status).toBe(401);
  });

  it("rejects a regular user (not admin)", async () => {
    const app = createApp();
    const { token } = await registerUser(app);
    const res = await request(app).get("/api/admin/newsletter").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("lists subscribers with status counts", async () => {
    const app = createApp();
    const { token } = await registerAdmin(app);

    await NewsletterSubscriber.create({
      email: "confirmed@example.com",
      status: "confirmed",
      confirmToken: "tok-1",
      unsubscribeToken: "unsub-1",
    });
    await NewsletterSubscriber.create({
      email: "pending@example.com",
      status: "pending",
      confirmToken: "tok-2",
      unsubscribeToken: "unsub-2",
    });

    const res = await request(app).get("/api/admin/newsletter").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.counts.confirmed).toBe(1);
    expect(res.body.data.counts.pending).toBe(1);
    expect(res.body.data.total).toBe(2);
  });

  it("filters subscribers by status", async () => {
    const app = createApp();
    const { token } = await registerAdmin(app);

    await NewsletterSubscriber.create({
      email: "confirmed2@example.com",
      status: "confirmed",
      confirmToken: "tok-3",
      unsubscribeToken: "unsub-3",
    });
    await NewsletterSubscriber.create({
      email: "pending2@example.com",
      status: "pending",
      confirmToken: "tok-4",
      unsubscribeToken: "unsub-4",
    });

    const res = await request(app)
      .get("/api/admin/newsletter?status=confirmed")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.items[0].email).toBe("confirmed2@example.com");
  });
});
