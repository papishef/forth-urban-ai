import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { registerAdmin, registerUser } from "./test-helpers.js";
import { NewsletterSubscriber } from "../newsletter/newsletter-subscriber.model.js";

const validPostInput = {
  title: "5 Critical Checks for Abuja Land Titles",
  excerpt: "A quick pre-purchase checklist every buyer should run before committing.",
  bodyMarkdown: "# Checklist\n\nAlways verify FCDA R-of-O documentation before purchase.",
  category: "Legal & Due Diligence",
};

describe("admin blog routes", () => {
  it("rejects non-admins", async () => {
    const app = createApp();
    const res = await request(app).get("/api/admin/blog");
    expect(res.status).toBe(401);
  });

  it("rejects a regular authenticated user (not admin)", async () => {
    const app = createApp();
    const { token } = await registerUser(app);
    const res = await request(app).get("/api/admin/blog").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("creates a post with auto-generated slug when slug is omitted/blank", async () => {
    const app = createApp();
    const { token } = await registerAdmin(app);

    const createRes = await request(app)
      .post("/api/admin/blog")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...validPostInput, slug: "" });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.slug).toBe("5-critical-checks-for-abuja-land-titles");
    expect(createRes.body.data.status).toBe("draft");
  });

  it("creates a post with a blank coverImageUrl without failing validation", async () => {
    const app = createApp();
    const { token } = await registerAdmin(app);

    const createRes = await request(app)
      .post("/api/admin/blog")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...validPostInput, coverImageUrl: "" });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.coverImageUrl).toBeNull();
  });

  it("lists, updates, and soft-deletes a post", async () => {
    const app = createApp();
    const { token } = await registerAdmin(app);

    const createRes = await request(app)
      .post("/api/admin/blog")
      .set("Authorization", `Bearer ${token}`)
      .send(validPostInput);
    const postId = createRes.body.data.id as string;

    const listRes = await request(app).get("/api/admin/blog").set("Authorization", `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.total).toBe(1);

    const updateRes = await request(app)
      .patch(`/api/admin/blog/${postId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated Title" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.title).toBe("Updated Title");

    const deleteRes = await request(app)
      .delete(`/api/admin/blog/${postId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);

    const afterDeleteList = await request(app).get("/api/admin/blog").set("Authorization", `Bearer ${token}`);
    expect(afterDeleteList.body.data.total).toBe(0);
  });

  it("publishes a post and dispatches a newsletter campaign to confirmed subscribers", async () => {
    const app = createApp();
    const { token } = await registerAdmin(app);

    await NewsletterSubscriber.create({
      email: "confirmed-sub@example.com",
      status: "confirmed",
      confirmToken: "tok-confirm-1",
      unsubscribeToken: "tok-unsub-1",
    });

    const createRes = await request(app)
      .post("/api/admin/blog")
      .set("Authorization", `Bearer ${token}`)
      .send(validPostInput);
    const postId = createRes.body.data.id as string;

    const publishRes = await request(app)
      .post(`/api/admin/blog/${postId}/publish`)
      .set("Authorization", `Bearer ${token}`)
      .send({ sendNewsletter: true });

    expect(publishRes.status).toBe(200);
    expect(publishRes.body.data.post.status).toBe("published");
    expect(publishRes.body.data.post.publishedAt).not.toBeNull();
    expect(publishRes.body.data.newsletterResult.sentCount).toBe(1);
    expect(publishRes.body.data.post.newsletterSentAt).not.toBeNull();

    // Confirm it's now visible on the public route
    const publicRes = await request(app).get(`/api/blog/${createRes.body.data.slug}`);
    expect(publicRes.status).toBe(200);
  });

  it("publishes a post without sending a newsletter when sendNewsletter is false", async () => {
    const app = createApp();
    const { token } = await registerAdmin(app);

    const createRes = await request(app)
      .post("/api/admin/blog")
      .set("Authorization", `Bearer ${token}`)
      .send(validPostInput);
    const postId = createRes.body.data.id as string;

    const publishRes = await request(app)
      .post(`/api/admin/blog/${postId}/publish`)
      .set("Authorization", `Bearer ${token}`)
      .send({ sendNewsletter: false });

    expect(publishRes.status).toBe(200);
    expect(publishRes.body.data.post.newsletterSentAt).toBeNull();
  });
});
