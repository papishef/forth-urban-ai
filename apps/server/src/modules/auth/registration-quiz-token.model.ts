import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

/**
 * `registrationQuizTokens` — one document per *consumed* registration quiz
 * session token (keyed by its `jti`). The unique index makes consumption
 * atomic, so one completed quiz can create at most one account even under
 * concurrent replay.
 */
const registrationQuizTokenSchema = new Schema({
  jti: { type: String, required: true, unique: true },
  consumedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  ip: { type: String, default: null },
  expiresAt: { type: Date, required: true },
});

applyBaseSchema(registrationQuizTokenSchema);

export type RegistrationQuizTokenDocument = HydratedDocument<InferSchemaType<typeof registrationQuizTokenSchema>>;

export const RegistrationQuizToken = model("RegistrationQuizToken", registrationQuizTokenSchema);
