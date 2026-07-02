import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "./base-schema.plugin.js";

/**
 * `auditLogs` collection — see docs/ARCHITECTURE.md#5-database-schema-mongodb-atlas.
 * Written for every security-sensitive action (auth events, admin actions).
 */
const auditLogSchema = new Schema({
  actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  actorType: { type: String, enum: ["user", "admin", "system"], required: true },
  action: { type: String, required: true },
  targetType: { type: String, default: null },
  targetId: { type: Schema.Types.ObjectId, default: null },
  metadata: { type: Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: null },
});

applyBaseSchema(auditLogSchema);

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema>;

export const AuditLog = model("AuditLog", auditLogSchema);
