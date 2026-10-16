import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { registerAdmin, registerSubAdmin, registerUser } from "../admin/test-helpers.js";
import { User } from "../users/user.model.js";

describe("attendance kiosk authentication", () => {
  it("allows the owner to configure the password and records kiosk device metadata on check-in", async () => {
    const app = createApp();
    const owner = await registerAdmin(app);
    const ownerUser = await User.findById(owner.userId);

    const passwordRes = await request(app)
      .patch("/api/admin/settings/kiosk-password")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ kioskPassword: "office-kiosk-password" });

    expect(passwordRes.status).toBe(200);
    expect(passwordRes.body.data.kioskPasswordConfigured).toBe(true);

    const loginRes = await request(app)
      .post("/api/attendance/kiosk/login")
      .set("X-Kiosk-Device-Id", "office-tablet-01")
      .set("User-Agent", "OfficeTablet/1.0")
      .send({
        email: ownerUser!.email,
        password: "office-kiosk-password",
        durationHours: 2,
      });

    expect(loginRes.status).toBe(200);
    expect(new Date(loginRes.body.data.expiresAt).getTime()).toBeGreaterThan(Date.now() + 60 * 60 * 1000);

    const kioskToken = loginRes.body.data.token as string;
    const checkInRes = await request(app)
      .post("/api/attendance/kiosk/check-in")
      .set("Authorization", `Bearer ${kioskToken}`)
      .set("X-Kiosk-Device-Id", "office-tablet-01")
      .set("User-Agent", "OfficeTablet/1.0")
      .send({ type: "visitor", visitorName: "Visitor One", purpose: "inspect property" });

    expect(checkInRes.status).toBe(201);
    expect(checkInRes.body.data.source).toBe("kiosk");
    expect(checkInRes.body.data.deviceId).toBe("office-tablet-01");
    expect(checkInRes.body.data.deviceUserAgent).toBe("OfficeTablet/1.0");
  });

  it("requires the kiosk grant for sub-admins and keeps password configuration owner-only", async () => {
    const app = createApp();
    const owner = await registerAdmin(app);
    const subAdmin = await registerSubAdmin(app, {
      settings: { read: true, write: true },
      kiosk: { read: false, write: false },
    });

    const ownerUser = await User.findById(owner.userId);
    const subAdminUser = await User.findById(subAdmin.userId);

    await request(app)
      .patch("/api/admin/settings/kiosk-password")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ kioskPassword: "office-kiosk-password" });

    const ownerOnlyRes = await request(app)
      .patch("/api/admin/settings/kiosk-password")
      .set("Authorization", `Bearer ${subAdmin.token}`)
      .send({ kioskPassword: "another-password" });
    expect(ownerOnlyRes.status).toBe(403);

    const deniedLogin = await request(app)
      .post("/api/attendance/kiosk/login")
      .send({ email: subAdminUser!.email, password: "office-kiosk-password", durationHours: 1 });
    expect(deniedLogin.status).toBe(401);

    const granted = await registerUser(app);
    const grantedUser = await User.findById(granted.userId);
    await User.findByIdAndUpdate(granted.userId, {
      adminAccess: {
        title: "Kiosk Operator",
        ownerId: owner.userId,
        permissions: { kiosk: { read: true, write: false } },
        grantedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const grantedLogin = await request(app)
      .post("/api/attendance/kiosk/login")
      .send({ email: grantedUser!.email, password: "office-kiosk-password", durationHours: 1 });
    expect(grantedLogin.status).toBe(200);
    expect(ownerUser!.email).not.toBe(grantedUser!.email);
  });

  it("rejects kiosk operations without a kiosk bearer token", async () => {
    const app = createApp();
    const response = await request(app).get("/api/attendance/kiosk/staff-search?q=Jane");
    expect(response.status).toBe(401);
  });
});