import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

const adminMenuPermissionSchema = new Schema(
  {
    read: { type: Boolean, required: true, default: false },
    write: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

const adminAccessSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    permissions: { type: Map, of: adminMenuPermissionSchema, required: true, default: {} },
    grantedAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

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
  role: { type: String, enum: ["user", "admin"], default: "user" },
  status: { type: String, enum: ["active", "suspended"], default: "active" },
  adminAccess: { type: adminAccessSchema, default: null },
  // Completed Home-Readiness Quiz submitted with the registration form. Held
  // here until the email is confirmed, then saved via the quiz service (so
  // nurture emails never go to unconfirmed/spam addresses) and cleared.
  registrationQuiz: { type: Schema.Types.Mixed, default: null, select: false },
  // Original email of a soft-deleted account; `email` is tombstoned so the
  // unique index doesn't keep the address locked forever.
  deletedEmail: { type: String, default: null, select: false },
  tenantId: { type: String, default: null },
});

applyBaseSchema(userSchema);

export type UserDocument = HydratedDocument<InferSchemaType<typeof userSchema>>;

export const User = model("User", userSchema);
