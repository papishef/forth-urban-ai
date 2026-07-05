import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { Notification } from "./notification.model.js";

describe("notifications routes", () => {
  async function registerAndGetToken(app: ReturnType<typeof createApp>) {
    const res = await request(app).post("/api/auth/register").send({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      password: "supersecret123",
    });
    return { token: res.body.data.tokens.accessToken as string, userId: res.body.data.user.id as string };
  }

  it("rejects notification routes without an access token", async () => {
    const app = createApp();
    const res = await request(app).get("/api/notifications/me");
    expect(res.status).toBe(401);
  });

  it("returns an empty list for a user with no notifications yet", async () => {
    const app = createApp();
    const { token } = await registerAndGetToken(app);

    const res = await request(app).get("/api/notifications/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("lists a user's own notifications, most recent first, and marks one read", async () => {
    const app = createApp();
    const { token, userId } = await registerAndGetToken(app);

    await Notification.create({ userId, type: "browser", title: "First", body: "First body" });
    const second = await Notification.create({ userId, type: "browser", title: "Second", body: "Second body" });

    const listRes = await request(app).get("/api/notifications/me").set("Authorization", `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(2);
    expect(listRes.body.data[0].title).toBe("Second");
    expect(listRes.body.data[0].read).toBe(false);

    const readRes = await request(app)
      .patch(`/api/notifications/${second._id.toString()}/read`)
      .set("Authorization", `Bearer ${token}`);
    expect(readRes.status).toBe(200);
    expect(readRes.body.data.read).toBe(true);
  });

  it("returns 404 when marking a notification that doesn't belong to the user", async () => {
    const app = createApp();
    const { token } = await registerAndGetToken(app);

    const res = await request(app)
      .patch("/api/notifications/000000000000000000000000/read")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
