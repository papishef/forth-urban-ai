import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

/**
 * `users` collection — see docs/ARCHITECTURE.md#5-database-schema-mongodb-atlas.
 *
 * `tenantId` is a reserved, unused field for now (AGENTS.md rule #9 —
 * multi-tenant-ready naming without building multi-tenancy yet).
 */
const userSchema = new Schema({
  firstName: { type: String, required: true, trim: true, maxlength: 60 },
  lastName: { type: String, required: true, trim: true, maxlength: 60 },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  passwordHash: { type: String, select: false, default: null },
  authProvider: { type: String, enum: ["local", "google"], default: "local" },
  googleId: { type: String, default: null, index: true, sparse: true },
  emailVerified: { type: Boolean, default: false },
  whatsappNumber: { type: String, default: null },
  currentCity: { type: String, default: null },
  currentCountry: { type: String, default: null },
  isDiaspora: { type: Boolean, default: false },
  role: { type: String, enum: ["user", "admin", "sales"], default: "user" },
  status: { type: String, enum: ["active", "suspended"], default: "active" },
  tenantId: { type: String, default: null },
});

applyBaseSchema(userSchema);

export type UserDocument = HydratedDocument<InferSchemaType<typeof userSchema>>;

export const User = model("User", userSchema);
