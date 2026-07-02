import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

/** Password-reset tokens — separate from OTP so reset links use a long opaque token, not a 6-digit code. */
const passwordResetTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  consumedAt: { type: Date, default: null },
});

applyBaseSchema(passwordResetTokenSchema);

export type PasswordResetTokenDocument = HydratedDocument<InferSchemaType<typeof passwordResetTokenSchema>>;

export const PasswordResetToken = model("PasswordResetToken", passwordResetTokenSchema);
