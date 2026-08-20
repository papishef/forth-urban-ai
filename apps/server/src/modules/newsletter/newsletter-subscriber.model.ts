import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";
import type { NewsletterSubscriberDTO } from "@forth-urban/shared-types";

const newsletterSubscriberSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "unsubscribed"],
    default: "pending",
    index: true,
  },
  confirmToken: { type: String, required: true, index: true },
  unsubscribeToken: { type: String, required: true, index: true },
  source: { type: String, default: "website-footer" },
  confirmedAt: { type: Date, default: null },
  unsubscribedAt: { type: Date, default: null },
});

applyBaseSchema(newsletterSubscriberSchema);

export type NewsletterSubscriberDocument = HydratedDocument<InferSchemaType<typeof newsletterSubscriberSchema>>;
export const NewsletterSubscriber = model("NewsletterSubscriber", newsletterSubscriberSchema);

export function toNewsletterSubscriberDTO(doc: NewsletterSubscriberDocument): NewsletterSubscriberDTO {
  return {
    id: doc._id.toString(),
    email: doc.email,
    status: doc.status as NewsletterSubscriberDTO["status"],
    source: doc.source,
    confirmedAt: doc.confirmedAt ? doc.confirmedAt.toISOString() : null,
    unsubscribedAt: doc.unsubscribedAt ? doc.unsubscribedAt.toISOString() : null,
    createdAt: (doc.get("createdAt") as Date).toISOString(),
  };
}
