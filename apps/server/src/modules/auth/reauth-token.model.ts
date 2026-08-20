import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

const reauthTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  tokenHash: { type: String, required: true },
  purpose: { type: String, enum: ["admin-access-change"], required: true },
  expiresAt: { type: Date, required: true, index: true, expires: 0 },
  consumedAt: { type: Date, default: null },
});

applyBaseSchema(reauthTokenSchema);

export type ReauthTokenDocument = HydratedDocument<InferSchemaType<typeof reauthTokenSchema>>;

export const ReauthToken = model("ReauthToken", reauthTokenSchema);