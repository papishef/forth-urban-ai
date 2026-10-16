import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { BlogPost } from "./blog-post.model.js";

describe("Blog Routes (Public)", () => {
  it("lists published blog posts only", async () => {
    const app = createApp();

    await BlogPost.create({
      title: "How to Verify Abuja Land Titles in 2026",
      slug: "how-to-verify-abuja-land-titles-2026",
      excerpt: "A complete step-by-step legal guide on FCDA R-of-O and C-of-O documentation.",
      bodyMarkdown: "# How to Verify Abuja Land Titles\n\nAlways ensure due diligence...",
      category: "Legal & Due Diligence",
      tags: ["Abuja", "FCDA", "Verification"],
      status: "published",
      publishedAt: new Date(),
    });

    await BlogPost.create({
      title: "Draft Secret Article",
      slug: "draft-secret-article",
      excerpt: "This is a draft that public should not see.",
      bodyMarkdown: "# Secret draft",
      category: "Market Insights",
      tags: ["Draft"],
      status: "draft",
    });

    const res = await request(app).get("/api/blog");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].slug).toBe("how-to-verify-abuja-land-titles-2026");
  });

  it("fetches a single published post by slug", async () => {
    const app = createApp();

    await BlogPost.create({
      title: "Why Guzape II is Abuja's Next High-Growth Zone",
      slug: "why-guzape-ii-is-abujas-next-high-growth-zone",
      excerpt: "Explore infrastructure development and capital appreciation projections.",
      bodyMarkdown: "## Guzape II Investment Analysis\n\nGuzape II offers rapid appreciation.",
      category: "Area Spotlights",
      tags: ["Guzape II", "Investment"],
      status: "published",
      publishedAt: new Date(),
    });

    const res = await request(app).get("/api/blog/why-guzape-ii-is-abujas-next-high-growth-zone");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Why Guzape II is Abuja's Next High-Growth Zone");
    expect(res.body.data.bodyMarkdown).toContain("Guzape II offers rapid appreciation");
  });

  it("returns 404 for non-existent or draft post on public route", async () => {
    const app = createApp();
    const res = await request(app).get("/api/blog/non-existent-article-slug");
    expect(res.status).toBe(404);
  });
});
