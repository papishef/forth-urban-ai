import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { registerAdmin, registerSales, registerUser } from "./test-helpers.js";

describe("admin users routes", () => {
  it("rejects admin routes without a token", async () => {
    const app = createApp();
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
  });

  it("rejects a non-admin user with 403", async () => {
    const app = createApp();
    const { token } = await registerUser(app);
    const res = await request(app).get("/api/admin/users").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("lists users, paginated, for an admin", async () => {
    const app = createApp();
    const { token } = await registerAdmin(app);
    await registerUser(app, { email: "buyer1@example.com" });
    await registerUser(app, { email: "buyer2@example.com" });

    const res = await request(app).get("/api/admin/users").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBeGreaterThanOrEqual(3);
    expect(res.body.data.page).toBe(1);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it("gets a single user by id", async () => {
    const app = createApp();
    const { token } = await registerAdmin(app);
    const { userId } = await registerUser(app, { email: "buyer3@example.com" });

    const res = await request(app).get(`/api/admin/users/${userId}`).set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("buyer3@example.com");
  });

  it("returns 404 for an unknown user id", async () => {
    const app = createApp();
    const { token } = await registerAdmin(app);

    const res = await request(app)
      .get("/api/admin/users/000000000000000000000000")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("updates a user's role/status", async () => {
    const app = createApp();
    const { token } = await registerAdmin(app);
    const { userId } = await registerUser(app, { email: "buyer4@example.com" });

    const res = await request(app)
      .patch(`/api/admin/users/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "sales", status: "suspended" });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("sales");
    expect(res.body.data.status).toBe("suspended");
  });

  it("lets a sales user list users (read-only) but rejects their attempt to change role/status", async () => {
    const app = createApp();
    const { token } = await registerSales(app);
    const { userId } = await registerUser(app, { email: "buyer5@example.com" });

    const listRes = await request(app).get("/api/admin/users").set("Authorization", `Bearer ${token}`);
    expect(listRes.status).toBe(200);

    const patchRes = await request(app)
      .patch(`/api/admin/users/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "admin" });
    expect(patchRes.status).toBe(403);
  });
});
