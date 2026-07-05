import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

/**
 * `calculatorResults` collection — docs/ARCHITECTURE.md#5-database-schema-mongodb-atlas.
 *
 * Persists every Budget/Hidden Cost/ROI calculator run (Phase 4) for CRM
 * context and email personalization (docs/PRODUCT_SPEC.md#15-crm--sales-follow-up).
 * `inputs`/`outputs` are stored as opaque JSON since each `type` has a
 * different shape — the typed contract lives in the Decision Engine
 * (apps/server/src/modules/decision-engine/calculators.ts) and shared DTOs
 * (packages/shared-types), not in this schema.
 */
const calculatorResultSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
  type: { type: String, enum: ["budget", "hiddenCost", "roi"], required: true },
  inputs: { type: Schema.Types.Mixed, required: true },
  outputs: { type: Schema.Types.Mixed, required: true },
});

calculatorResultSchema.index({ userId: 1, type: 1 });

applyBaseSchema(calculatorResultSchema);

export type CalculatorResultDocument = HydratedDocument<InferSchemaType<typeof calculatorResultSchema>>;

export const CalculatorResult = model("CalculatorResult", calculatorResultSchema);
