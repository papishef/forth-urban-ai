import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { NewsletterSubscriber } from "./newsletter-subscriber.model.js";

describe("Newsletter Routes (Double Opt-In)", () => {
  it("subscribes a new user with pending status", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/newsletter/subscribe")
      .send({ email: "subscriber@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const sub = await NewsletterSubscriber.findOne({ email: "subscriber@example.com" });
    expect(sub).not.toBeNull();
    expect(sub?.status).toBe("pending");
    expect(sub?.confirmToken).toBeDefined();
    expect(sub?.unsubscribeToken).toBeDefined();
  });

  it("confirms subscription when valid confirm token is passed", async () => {
    const app = createApp();
    const sub = await NewsletterSubscriber.create({
      email: "confirm-test@example.com",
      status: "pending",
      confirmToken: "valid-token-12345",
      unsubscribeToken: "unsub-token-12345",
    });

    const res = await request(app).get(`/api/newsletter/confirm/${sub.confirmToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("confirmed");

    const updated = await NewsletterSubscriber.findById(sub._id);
    expect(updated?.status).toBe("confirmed");
    expect(updated?.confirmedAt).not.toBeNull();
  });

  it("unsubscribes user when valid unsubscribe token is passed", async () => {
    const app = createApp();
    const sub = await NewsletterSubscriber.create({
      email: "unsub-test@example.com",
      status: "confirmed",
      confirmToken: "confirm-token-999",
      unsubscribeToken: "unsub-token-999",
    });

    const res = await request(app).get(`/api/newsletter/unsubscribe/${sub.unsubscribeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("unsubscribed");

    const updated = await NewsletterSubscriber.findById(sub._id);
    expect(updated?.status).toBe("unsubscribed");
  });
});
