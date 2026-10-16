import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

/**
 * `registrationIntents` — a completed Home-Readiness Quiz waiting to be
 * attached to a brand-new Google account. The OAuth redirect can't carry a
 * request body, so the client posts the quiz first and passes the opaque
 * intent token through the OAuth `state` parameter. Only a SHA-256 of the
 * token is stored.
 */
const registrationIntentSchema = new Schema({
  tokenHash: { type: String, required: true, unique: true },
  provider: { type: String, enum: ["google"], required: true },
  answers: { type: Schema.Types.Mixed, required: true },
  quizSessionJti: { type: String, required: true },
  quizSessionExpiresAt: { type: Date, required: true },
  ip: { type: String, default: null },
  expiresAt: { type: Date, required: true },
  consumedAt: { type: Date, default: null },
});

applyBaseSchema(registrationIntentSchema);

export type RegistrationIntentDocument = HydratedDocument<InferSchemaType<typeof registrationIntentSchema>>;

export const RegistrationIntent = model("RegistrationIntent", registrationIntentSchema);
