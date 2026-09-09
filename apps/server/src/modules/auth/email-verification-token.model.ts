import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

const emailVerificationTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true },
  consumedAt: { type: Date, default: null },
});

applyBaseSchema(emailVerificationTokenSchema);

export type EmailVerificationTokenDocument = HydratedDocument<InferSchemaType<typeof emailVerificationTokenSchema>>;

export const EmailVerificationToken = model("EmailVerificationToken", emailVerificationTokenSchema);