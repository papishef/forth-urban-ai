import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";
import type { ContactMessageDTO } from "@forth-urban/shared-types";

const contactMessageSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, index: true },
  phone: { type: String, trim: true, default: null },
  reason: {
    type: String,
    enum: ["general", "buying", "site-inspection", "partnership", "other"],
    default: "general",
    index: true,
  },
  message: { type: String, required: true, trim: true, maxlength: 3000 },
  status: {
    type: String,
    enum: ["new", "read", "archived"],
    default: "new",
    index: true,
  },
});

applyBaseSchema(contactMessageSchema);

export type ContactMessageDocument = HydratedDocument<InferSchemaType<typeof contactMessageSchema>>;
export const ContactMessage = model("ContactMessage", contactMessageSchema);

export function toContactMessageDTO(doc: ContactMessageDocument): ContactMessageDTO {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    phone: doc.phone ?? null,
    reason: doc.reason as ContactMessageDTO["reason"],
    message: doc.message,
    status: doc.status as ContactMessageDTO["status"],
    createdAt: (doc.get("createdAt") as Date).toISOString(),
    updatedAt: (doc.get("updatedAt") as Date).toISOString(),
  };
}
