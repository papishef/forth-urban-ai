import { Router } from "express";
import type { BlogPostDTO, BlogPostListItemDTO, PaginatedResultDTO } from "@forth-urban/shared-types";
import { ApiError, type ApiEnvelope } from "../../middleware/error-handler.js";
import { BlogPost, toBlogPostDTO, toBlogPostListItemDTO } from "./blog-post.model.js";

export const blogRouter: Router = Router();

function parsePagination(query: Record<string, unknown>): {
  page: number;
  limit: number;
  category?: string;
  tag?: string;
} {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const category = typeof query.category === "string" && query.category ? query.category : undefined;
  const tag = typeof query.tag === "string" && query.tag ? query.tag : undefined;
  return { page, limit, category, tag };
}

/**
 * Public Blog endpoints for website visitors:
 * GET /api/blog — List published posts (paginated, filter by category/tag)
 * GET /api/blog/:slug — Single published post by slug
 */
blogRouter.get("/", async (req, res, next) => {
  try {
    const { page, limit, category, tag } = parsePagination(req.query as Record<string, unknown>);
    const filter: Record<string, unknown> = { status: "published" };

    if (category) {
      filter.category = category;
    }
    if (tag) {
      filter.tags = tag;
    }

    const [posts, total] = await Promise.all([
      BlogPost.find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      BlogPost.countDocuments(filter),
    ]);

    const data: PaginatedResultDTO<BlogPostListItemDTO> = {
      items: posts.map(toBlogPostListItemDTO),
      total,
      page,
      limit,
    };

    const body: ApiEnvelope = { success: true, message: "OK", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

blogRouter.get("/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const post = await BlogPost.findOne({ slug, status: "published" });

    if (!post) {
      throw new ApiError(404, "Blog post not found");
    }

    const body: ApiEnvelope = { success: true, message: "OK", data: toBlogPostDTO(post), errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
