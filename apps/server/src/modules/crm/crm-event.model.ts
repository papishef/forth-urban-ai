import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

/**
 * `crmEvents` collection — docs/ARCHITECTURE.md#5-database-schema-mongodb-atlas.
 *
 * Intentionally an append-only event log (`eventType` + `payload`), not a
 * mutable per-user record, so it "can sync outward later without migration"
 * (ARCHITECTURE §9 future scalability hooks). A user's *current* pipeline
 * stage is simply the `pipelineStage` on their most recent event. Full CRM
 * board UI is Phase 7 (`/api/admin/crm`) — this module only writes events.
 */
const crmEventSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  eventType: { type: String, required: true, trim: true },
  payload: { type: Schema.Types.Mixed, default: {} },
  salesRepId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  notes: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  pipelineStage: {
    type: String,
    enum: ["new", "contacted", "qualified", "inspectionScheduled", "inspectionCompleted", "won", "lost"],
    required: true,
  },
});

crmEventSchema.index({ userId: 1, createdAt: -1 });

applyBaseSchema(crmEventSchema);

export type CrmEventDocument = HydratedDocument<InferSchemaType<typeof crmEventSchema>>;

export const CrmEvent = model("CrmEvent", crmEventSchema);
