import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

/**
 * `sessions` collection — one document per active refresh token
 * (see docs/ARCHITECTURE.md#5-database-schema-mongodb-atlas). The refresh
 * token itself is never stored, only its hash, so a DB leak doesn't leak
 * usable tokens.
 */
const sessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  refreshTokenHash: { type: String, required: true },
  userAgent: { type: String, default: null },
  ip: { type: String, default: null },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
});

applyBaseSchema(sessionSchema);

export type SessionDocument = HydratedDocument<InferSchemaType<typeof sessionSchema>>;

export const Session = model("Session", sessionSchema);
