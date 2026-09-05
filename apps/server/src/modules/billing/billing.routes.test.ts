import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { registerAdmin, registerUser } from "../admin/test-helpers.js";

describe("admin storage billing routes", () => {
  const app = createApp();

  it("returns the global free storage status to an admin", async () => {
    const { token } = await registerAdmin(app);

    const response = await request(app)
      .get("/api/admin/billing/storage")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.planId).toBe("free");
    expect(response.body.data.totalBytes).toBe(50 * 1024 * 1024);
    expect(response.body.data.usedBytes).toBe(0);
  });

  it("does not expose storage status to a regular user", async () => {
    const { token } = await registerUser(app);

    const response = await request(app)
      .get("/api/admin/billing/storage")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it("rejects an unsigned Flutterwave webhook", async () => {
    const response = await request(app).post("/api/billing/webhook").send({
      event: "charge.completed",
      data: { id: "transaction-1", tx_ref: "forth-storage-test", status: "successful" },
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/webhook signature/i);
  });
});