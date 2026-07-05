import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

/**
 * `settings` collection — a single global document (Phase 7 admin dashboard,
 * docs/IMPLEMENTATION_PLAN.md#phase-7--admin-dashboard).
 *
 * Holds admin-editable defaults so behavior can change without a redeploy:
 * - `propertyMatchWeights` — overrides decision-engine/property-matching.ts's
 *   `DEFAULT_PROPERTY_MATCH_WEIGHTS` (property recommendation scoring).
 * - `roiAssumptionDefaults` — the conservative/moderate/optimistic rates
 *   pre-filled on the admin "add property" form (each property still stores
 *   its own `roiAssumptions`, per docs/ARCHITECTURE.md §5 — this is only a
 *   convenience default, not a global override of stored per-property rates).
 *
 * `key` is always `"global"` — this repo has no multi-tenant settings yet
 * (AGENTS.md rule #9 reserves `tenantId` elsewhere, not here, since a single
 * settings doc per tenant would be the natural Phase 12 evolution).
 */
const settingsSchema = new Schema({
  key: { type: String, required: true, unique: true, default: "global" },
  propertyMatchWeights: {
    budget: { type: Number, required: true, default: 40 },
    area: { type: Number, required: true, default: 25 },
    buyerGoal: { type: Number, required: true, default: 20 },
    paymentStyle: { type: Number, required: true, default: 10 },
    lifestyle: { type: Number, required: true, default: 5 },
  },
  roiAssumptionDefaults: {
    conservative: { type: Number, required: true, default: 0.05 },
    moderate: { type: Number, required: true, default: 0.1 },
    optimistic: { type: Number, required: true, default: 0.15 },
  },
});

applyBaseSchema(settingsSchema);

export type SettingsDocument = HydratedDocument<InferSchemaType<typeof settingsSchema>>;

export const Settings = model("Settings", settingsSchema);
