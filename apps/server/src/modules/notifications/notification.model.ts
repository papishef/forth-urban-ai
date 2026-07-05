import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

/**
 * `notifications` collection — docs/ARCHITECTURE.md#5-database-schema-mongodb-atlas.
 *
 * In-app notification feed for logged-in users (PRODUCT_SPEC §16 dashboard
 * "resume tools/see saved results"). Also the backing store shown by the
 * client's basic browser Notification API integration (Phase 6 task list).
 */
const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["email", "browser", "sms", "whatsapp"], required: true },
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true },
  read: { type: Boolean, required: true, default: false },
});

notificationSchema.index({ userId: 1, createdAt: -1 });

applyBaseSchema(notificationSchema);

export type NotificationDocument = HydratedDocument<InferSchemaType<typeof notificationSchema>>;

export const Notification = model("Notification", notificationSchema);
