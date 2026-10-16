import { Router } from "express";
import {
  adminBlogMediaDeleteSchema,
  adminBlogMediaUploadSchema,
  adminBlogPostInputSchema,
  adminBlogPostUpdateSchema,
  adminPublishBlogPostSchema,
} from "@forth-urban/validation";
import type { BlogPostDTO, PaginatedResultDTO } from "@forth-urban/shared-types";
import { ApiError, type ApiEnvelope } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import { deleteMediaByUrl, extractPublicIdFromUrl, uploadMedia, assertValidMediaUpload } from "../../lib/cloudinary.util.js";
import { logger } from "../../config/logger.js";
import { requireAdminPermission } from "../auth/permissions.js";
import { BlogPost, toBlogPostDTO } from "./blog-post.model.js";
import { sendBlogNewsletterCampaign } from "./blog-newsletter-campaign.service.js";
import {
  assertWithinQuota,
  getTrackedAsset,
  registerMediaAsset,
  releaseMediaAsset,
  releaseMediaAssetsForOwner,
} from "../billing/storage-quota.service.js";

export const blogAdminRouter: Router = Router();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parsePagination(query: Record<string, unknown>): {
  page: number;
  limit: number;
  status?: string;
  category?: string;
} {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const status = typeof query.status === "string" && query.status ? query.status : undefined;
  const category = typeof query.category === "string" && query.category ? query.category : undefined;
  return { page, limit, status, category };
}

blogAdminRouter.get("/", async (req, res, next) => {
  try {
    const { page, limit, status, category } = parsePagination(req.query as Record<string, unknown>);
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const [posts, total] = await Promise.all([
      BlogPost.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      BlogPost.countDocuments(filter),
    ]);

    const data: PaginatedResultDTO<BlogPostDTO> = {
      items: posts.map(toBlogPostDTO),
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

blogAdminRouter.get("/:id", async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) throw new ApiError(404, "Blog post not found");
    const body: ApiEnvelope = { success: true, message: "OK", data: toBlogPostDTO(post), errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

blogAdminRouter.post("/", requireAdminPermission("blog", "write"), validateBody(adminBlogPostInputSchema), async (req, res, next) => {
  try {
    let slug = req.body.slug || slugify(req.body.title);
    
    // Check if slug already exists; if so, append unique timestamp suffix
    const existing = await BlogPost.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const post = await BlogPost.create({
      ...req.body,
      slug,
      publishedAt: req.body.status === "published" ? new Date() : null,
    });

    await recordAuditLog({
      actorId: req.auth!.sub,
      actorType: "admin",
      action: "blog_post_created",
      targetType: "BlogPost",
      targetId: post._id.toString(),
      metadata: { title: post.title, slug: post.slug, status: post.status },
      ipAddress: req.ip ?? null,
    });

    const body: ApiEnvelope = { success: true, message: "Blog post created", data: toBlogPostDTO(post), errors: null };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

blogAdminRouter.patch("/:id", requireAdminPermission("blog", "write"), validateBody(adminBlogPostUpdateSchema), async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) throw new ApiError(404, "Blog post not found");

    if (req.body.title && !req.body.slug && !post.slug) {
      req.body.slug = slugify(req.body.title);
    }

    // If status changed to published and publishedAt is null, set publishedAt
    if (req.body.status === "published" && !post.publishedAt) {
      post.publishedAt = new Date();
    }

    Object.assign(post, req.body);
    await post.save();

    await recordAuditLog({
      actorId: req.auth!.sub,
      actorType: "admin",
      action: "blog_post_updated",
      targetType: "BlogPost",
      targetId: post._id.toString(),
      metadata: { title: post.title, status: post.status },
      ipAddress: req.ip ?? null,
    });

    const body: ApiEnvelope = { success: true, message: "Blog post updated", data: toBlogPostDTO(post), errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

blogAdminRouter.delete("/:id", requireAdminPermission("blog", "write"), async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) throw new ApiError(404, "Blog post not found");

    post.set("deletedAt", new Date());
    await post.save();

    await releaseMediaAssetsForOwner("blog", post._id.toString());
    if (post.coverImageUrl) {
      await deleteMediaByUrl("image", post.coverImageUrl);
    }

    await recordAuditLog({
      actorId: req.auth!.sub,
      actorType: "admin",
      action: "blog_post_deleted",
      targetType: "BlogPost",
      targetId: post._id.toString(),
      metadata: { title: post.title, slug: post.slug },
      ipAddress: req.ip ?? null,
    });

    const body: ApiEnvelope = { success: true, message: "Blog post deleted", data: null, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

blogAdminRouter.post("/:id/media", requireAdminPermission("blog", "write"), validateBody(adminBlogMediaUploadSchema), async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) throw new ApiError(404, "Blog post not found");

    const buffer = Buffer.from(req.body.base64Data, "base64");
    assertValidMediaUpload("image", req.body.mimeType, buffer.byteLength);
    const previousAsset = post.coverImageUrl ? await getTrackedAsset(post.coverImageUrl) : null;
    await assertWithinQuota(buffer.byteLength, previousAsset?.sizeBytes ?? 0);
    const url = await uploadMedia("image", buffer, {
      mimeType: req.body.mimeType,
      folder: `blog/${post._id}`,
    });

    try {
      await registerMediaAsset({
        url,
        publicId: extractPublicIdFromUrl(url, "image"),
        kind: "image",
        mimeType: req.body.mimeType,
        sizeBytes: buffer.byteLength,
        ownerType: "blog",
        ownerId: post._id.toString(),
      });
      post.coverImageUrl = url;
      await post.save();
    } catch (error) {
      await releaseMediaAsset(url);
      await deleteMediaByUrl("image", url);
      throw error;
    }

    if (post.coverImageUrl && previousAsset) {
      await releaseMediaAsset(previousAsset.url);
      await deleteMediaByUrl("image", previousAsset.url);
    }

    await recordAuditLog({
      actorId: req.auth!.sub,
      actorType: "admin",
      action: "blog_post_cover_uploaded",
      targetType: "BlogPost",
      targetId: post._id.toString(),
      metadata: { url },
      ipAddress: req.ip ?? null,
    });

    const body: ApiEnvelope = { success: true, message: "Cover image uploaded", data: toBlogPostDTO(post), errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

blogAdminRouter.delete("/:id/media", requireAdminPermission("blog", "write"), validateBody(adminBlogMediaDeleteSchema), async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) throw new ApiError(404, "Blog post not found");
    if (!post.coverImageUrl || post.coverImageUrl !== req.body.url) {
      throw new ApiError(404, "Cover image not found on this post");
    }

    const url = post.coverImageUrl;
    post.coverImageUrl = null;
    await post.save();
    await releaseMediaAsset(url);
    await deleteMediaByUrl("image", url);

    await recordAuditLog({
      actorId: req.auth!.sub,
      actorType: "admin",
      action: "blog_post_cover_deleted",
      targetType: "BlogPost",
      targetId: post._id.toString(),
      ipAddress: req.ip ?? null,
    });

    const body: ApiEnvelope = { success: true, message: "Cover image removed", data: toBlogPostDTO(post), errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

blogAdminRouter.post("/:id/publish", requireAdminPermission("blog", "write"), validateBody(adminPublishBlogPostSchema), async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) throw new ApiError(404, "Blog post not found");

    post.status = "published";
    if (!post.publishedAt) {
      post.publishedAt = new Date();
    }
    await post.save();

    let newsletterResult = null;
    if (req.body.sendNewsletter) {
      try {
        newsletterResult = await sendBlogNewsletterCampaign(post);
      } catch (err) {
        logger.error({ err, postId: post._id }, "Failed to send newsletter campaign during blog publish");
      }
    }

    await recordAuditLog({
      actorId: req.auth!.sub,
      actorType: "admin",
      action: "blog_post_published",
      targetType: "BlogPost",
      targetId: post._id.toString(),
      metadata: {
        title: post.title,
        slug: post.slug,
        newsletterDispatched: req.body.sendNewsletter,
        newsletterResult,
      },
      ipAddress: req.ip ?? null,
    });

    const body: ApiEnvelope = {
      success: true,
      message: req.body.sendNewsletter
        ? `Blog post published and newsletter campaign sent to ${newsletterResult?.sentCount ?? 0} subscribers.`
        : "Blog post published successfully.",
      data: {
        post: toBlogPostDTO(post),
        newsletterDispatched: req.body.sendNewsletter,
        newsletterResult,
      },
      errors: null,
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
