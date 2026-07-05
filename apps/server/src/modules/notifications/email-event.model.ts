import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

/**
 * `emailEvents` collection — docs/ARCHITECTURE.md#5-database-schema-mongodb-atlas.
 *
 * One record per email send attempt (booking confirmations, quiz-abandonment
 * reminders, segment-based nurture) — see docs/PRODUCT_SPEC.md#14-lead-capture--email-marketing.
 * `providerMessageId` is Resend's message id when available, so delivery can
 * be cross-referenced with Resend's dashboard/webhooks later.
 */
const emailEventSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  campaign: { type: String, required: true, trim: true },
  template: { type: String, required: true, trim: true },
  status: { type: String, enum: ["sent", "opened", "clicked", "bounced"], required: true, default: "sent" },
  providerMessageId: { type: String, default: null },
});

emailEventSchema.index({ userId: 1, campaign: 1 });

applyBaseSchema(emailEventSchema);

export type EmailEventDocument = HydratedDocument<InferSchemaType<typeof emailEventSchema>>;

export const EmailEvent = model("EmailEvent", emailEventSchema);
