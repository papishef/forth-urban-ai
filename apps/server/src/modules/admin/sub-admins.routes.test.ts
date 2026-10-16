import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { registerAdmin, registerUser } from "./test-helpers.js";

async function getReauthToken(app: ReturnType<typeof createApp>, token: string): Promise<string> {
  const response = await request(app)
    .post("/api/auth/password/verify")
    .set("Authorization", `Bearer ${token}`)
    .send({ password: "supersecret123" });
  expect(response.status).toBe(200);
  return response.body.data.reauthToken as string;
}

describe("admin sub-admin routes", () => {
  it("creates a named sub-admin from an existing user and scopes the grant to the owner", async () => {
    const app = createApp();
    const owner = await registerAdmin(app);
    const target = await registerUser(app, { email: "team-member@example.com" });

    const withoutReauth = await request(app)
      .post("/api/admin/sub-admins")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ userId: target.userId, title: "Inspection Lead", permissions: { inspections: { read: true, write: true } } });
    expect(withoutReauth.status).toBe(401);

    const reauthToken = await getReauthToken(app, owner.token);
    const created = await request(app)
      .post("/api/admin/sub-admins")
      .set("Authorization", `Bearer ${owner.token}`)
      .set("x-reauth-token", reauthToken)
      .send({ userId: target.userId, title: "Inspection Lead", permissions: { inspections: { read: true, write: true } } });

    expect(created.status).toBe(201);
    expect(created.body.data.role).toBe("user");
    expect(created.body.data.adminAccess.title).toBe("Inspection Lead");
    expect(created.body.data.adminAccess.permissions.inspections).toEqual({ read: true, write: true });

    const list = await request(app).get("/api/admin/sub-admins").set("Authorization", `Bearer ${owner.token}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].id).toBe(target.userId);
  });

  it("allows read-only menu access but rejects the corresponding write operation", async () => {
    const app = createApp();
    const owner = await registerAdmin(app);
    const target = await registerUser(app, { email: "read-only@example.com" });
    const reauthToken = await getReauthToken(app, owner.token);

    const created = await request(app)
      .post("/api/admin/sub-admins")
      .set("Authorization", `Bearer ${owner.token}`)
      .set("x-reauth-token", reauthToken)
      .send({ userId: target.userId, title: "Viewer", permissions: { inspections: { read: true, write: false } } });
    expect(created.status).toBe(201);

    const list = await request(app).get("/api/admin/inspections").set("Authorization", `Bearer ${target.token}`);
    expect(list.status).toBe(200);

    const write = await request(app)
      .patch("/api/admin/inspections/000000000000000000000000")
      .set("Authorization", `Bearer ${target.token}`)
      .send({ status: "confirmed" });
    expect(write.status).toBe(403);
  });

  it("suspends and revokes access when the owner removes every menu, then restores a regular user on removal", async () => {
    const app = createApp();
    const owner = await registerAdmin(app);
    const target = await registerUser(app, { email: "revocation@example.com" });
    let reauthToken = await getReauthToken(app, owner.token);

    const created = await request(app)
      .post("/api/admin/sub-admins")
      .set("Authorization", `Bearer ${owner.token}`)
      .set("x-reauth-token", reauthToken)
      .send({ userId: target.userId, title: "Temporary Access", permissions: { inspections: { read: true, write: false } } });
    expect(created.status).toBe(201);

    reauthToken = await getReauthToken(app, owner.token);
    const suspended = await request(app)
      .patch(`/api/admin/sub-admins/${target.userId}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .set("x-reauth-token", reauthToken)
      .send({ permissions: {} });
    expect(suspended.status).toBe(200);
    expect(suspended.body.data.status).toBe("suspended");

    const blocked = await request(app).get("/api/users/me").set("Authorization", `Bearer ${target.token}`);
    expect(blocked.status).toBe(403);

    reauthToken = await getReauthToken(app, owner.token);
    const removed = await request(app)
      .delete(`/api/admin/sub-admins/${target.userId}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .set("x-reauth-token", reauthToken)
      .send({});
    expect(removed.status).toBe(200);

    const restored = await request(app).get("/api/users/me").set("Authorization", `Bearer ${target.token}`);
    expect(restored.status).toBe(200);
    expect(restored.body.data.role).toBe("user");
    expect(restored.body.data.adminAccess).toBeNull();
  });
});