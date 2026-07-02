import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

describe("users routes", () => {
  async function registerAndGetToken(app: ReturnType<typeof createApp>) {
    const res = await request(app).post("/api/auth/register").send({
      firstName: "Rosalind",
      lastName: "Franklin",
      email: "rosalind@example.com",
      password: "supersecret123",
    });
    return res.body.data.tokens.accessToken as string;
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
});
