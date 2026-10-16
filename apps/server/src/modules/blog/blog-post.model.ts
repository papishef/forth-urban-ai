import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";
import type { BlogPostDTO, BlogPostListItemDTO } from "@forth-urban/shared-types";

const blogPostSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  excerpt: { type: String, required: true, trim: true, maxlength: 500 },
  bodyMarkdown: { type: String, required: true, trim: true },
  coverImageUrl: { type: String, trim: true, default: null },
  category: {
    type: String,
    enum: [
      "Market Insights",
      "Investment Guides",
      "Legal & Due Diligence",
      "Company News",
      "Area Spotlights",
    ],
    required: true,
    index: true,
  },
  tags: { type: [String], default: [] },
  status: {
    type: String,
    enum: ["draft", "published"],
    default: "draft",
    index: true,
  },
  publishedAt: { type: Date, default: null, index: true },
  authorName: { type: String, default: "Forth Urban Advisory Team", trim: true },
  seoTitle: { type: String, trim: true, default: null },
  seoDescription: { type: String, trim: true, default: null },
  newsletterSentAt: { type: Date, default: null },
});

applyBaseSchema(blogPostSchema);

export type BlogPostDocument = HydratedDocument<InferSchemaType<typeof blogPostSchema>>;
export const BlogPost = model("BlogPost", blogPostSchema);

export function toBlogPostDTO(doc: BlogPostDocument): BlogPostDTO {
  return {
    id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt,
    bodyMarkdown: doc.bodyMarkdown,
    coverImageUrl: doc.coverImageUrl ?? null,
    category: doc.category as BlogPostDTO["category"],
    tags: doc.tags ?? [],
    status: doc.status as BlogPostDTO["status"],
    publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : null,
    authorName: doc.authorName,
    seoTitle: doc.seoTitle ?? null,
    seoDescription: doc.seoDescription ?? null,
    newsletterSentAt: doc.newsletterSentAt ? doc.newsletterSentAt.toISOString() : null,
    createdAt: (doc.get("createdAt") as Date).toISOString(),
    updatedAt: (doc.get("updatedAt") as Date).toISOString(),
  };
}

export function toBlogPostListItemDTO(doc: BlogPostDocument): BlogPostListItemDTO {
  return {
    id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt,
    coverImageUrl: doc.coverImageUrl ?? null,
    category: doc.category as BlogPostListItemDTO["category"],
    tags: doc.tags ?? [],
    status: doc.status as BlogPostListItemDTO["status"],
    publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : null,
    authorName: doc.authorName,
    createdAt: (doc.get("createdAt") as Date).toISOString(),
  };
}
