import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { registerVerifiedUser } from "../../test/auth-helpers.js";

describe("users routes", () => {
  async function registerAndGetToken(app: ReturnType<typeof createApp>) {
    const { token } = await registerVerifiedUser(app, {
      firstName: "Rosalind",
      lastName: "Franklin",
      email: "rosalind@example.com",
    });
    return token;
  }

  it("rejects GET /me without an access token", async () => {
    const app = createApp();
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user's profile with a valid access token", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);

    const res = await request(app).get("/api/users/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("rosalind@example.com");
  });

  it("updates patchable profile fields", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentCity: "Abuja", isDiaspora: true });

    expect(res.status).toBe(200);
    expect(res.body.data.currentCity).toBe("Abuja");
    expect(res.body.data.isDiaspora).toBe(true);
  });

  it("rejects attempts to update role or other protected account fields", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "admin", passwordHash: "not-a-hash" });

    expect(res.status).toBe(400);
  });
});
