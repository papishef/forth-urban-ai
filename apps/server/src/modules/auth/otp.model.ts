import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

/**
 * One-time codes for email verification and password reset, keyed by email
 * rather than userId so email-verification OTPs can be requested before a
 * password-reset flow needs an existing account lookup.
 */
const otpSchema = new Schema({
  email: { type: String, required: true, index: true, lowercase: true, trim: true },
  codeHash: { type: String, required: true },
  purpose: { type: String, enum: ["email_verification", "login", "password_reset"], required: true },
  expiresAt: { type: Date, required: true },
  consumedAt: { type: Date, default: null },
  attempts: { type: Number, default: 0 },
});

applyBaseSchema(otpSchema);

export type OtpDocument = HydratedDocument<InferSchemaType<typeof otpSchema>>;

export const Otp = model("Otp", otpSchema);
