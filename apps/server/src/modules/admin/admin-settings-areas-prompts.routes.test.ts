import { describe, expect, it, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { registerAdmin, registerUser } from "./test-helpers.js";
import { getRawPrompt, PROMPTS_DIR } from "../ai-advisory/prompt-loader.js";
import { writeFileSync } from "node:fs";
import path from "node:path";

describe("admin settings routes", () => {
  it("reads defaults and updates property-match weights / ROI assumptions", async () => {
    const app = createApp();
    const { token } = await registerAdmin(app);

    const getRes = await request(app).get("/api/admin/settings").set("Authorization", `Bearer ${token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.propertyMatchWeights.budget).toBe(40);

    const patchRes = await request(app)
      .patch("/api/admin/settings")
      .set("Authorization", `Bearer ${token}`)
      .send({ propertyMatchWeights: { budget: 50 }, roiAssumptionDefaults: { conservative: 0.06 } });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.propertyMatchWeights.budget).toBe(50);
    expect(patchRes.body.data.propertyMatchWeights.area).toBe(25);
    expect(patchRes.body.data.roiAssumptionDefaults.conservative).toBe(0.06);
  });

  it("rejects non-admins", async () => {
    const app = createApp();
    const { token } = await registerUser(app);
    const res = await request(app).get("/api/admin/settings").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe("admin areas routes", () => {
  it("upserts and lists an area, then deletes it", async () => {
    const app = createApp();
    const { token } = await registerAdmin(app);

    const upsertRes = await request(app)
      .post("/api/admin/areas")
      .set("Authorization", `Bearer ${token}`)
      .send({ preferenceKey: "familyOriented", areaName: "Lugbe", description: "Family-friendly estate area" });
    expect(upsertRes.status).toBe(200);
    const areaId = upsertRes.body.data.id as string;

    const listRes = await request(app).get("/api/admin/areas").set("Authorization", `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.some((a: { id: string }) => a.id === areaId)).toBe(true);

    const deleteRes = await request(app).delete(`/api/admin/areas/${areaId}`).set("Authorization", `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);
  });
});

describe("admin prompts routes", () => {
  const key = "ask";
  let originalRaw: string;

  afterEach(() => {
    if (originalRaw) writeFileSync(path.join(PROMPTS_DIR, `${key}.md`), originalRaw, "utf-8");
  });

  it("lists prompts, fetches one by key, edits it (version bump), and previews it", async () => {
    const app = createApp();
    const { token } = await registerAdmin(app);
    originalRaw = getRawPrompt(key).raw;

    const listRes = await request(app).get("/api/admin/prompts").set("Authorization", `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.some((p: { key: string }) => p.key === key)).toBe(true);

    const getRes = await request(app).get(`/api/admin/prompts/${key}`).set("Authorization", `Bearer ${token}`);
    expect(getRes.status).toBe(200);
    const originalVersion = getRes.body.data.version as number;

    const patchRes = await request(app)
      .patch(`/api/admin/prompts/${key}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ body: getRes.body.data.body });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.version).toBe(originalVersion + 1);

    const previewRes = await request(app)
      .post(`/api/admin/prompts/${key}/preview`)
      .set("Authorization", `Bearer ${token}`)
      .send({ context: { question: "What is a survey plan?" } });
    expect(previewRes.status).toBe(200);
    expect(typeof previewRes.body.data.text).toBe("string");
  });

  it("returns 404 for an unknown prompt key", async () => {
    const app = createApp();
    const { token } = await registerAdmin(app);
    const res = await request(app).get("/api/admin/prompts/not-a-real-key").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
