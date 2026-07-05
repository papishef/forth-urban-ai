import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

/**
 * `areas` collection — Phase 7 admin-managed reference data that drives the
 * Best Abuja Area Quiz instead of the hardcoded lookup in
 * decision-engine/area-matching.ts's `AREA_PREFERENCE_MATCH`
 * (docs/ARCHITECTURE.md §9 future scalability hooks explicitly calls this
 * out: "an areas admin table driving the Area Quiz logic").
 *
 * `preferenceKey` mirrors the fixed `areaPreferenceSchema` enum from
 * packages/validation (the quiz's 6 answer options don't change), but the
 * *area name/description recommended for each* is admin-editable data, not
 * hardcoded strings in code.
 */
const areaSchema = new Schema({
  preferenceKey: {
    type: String,
    enum: [
      "premiumLiving",
      "affordableOwnership",
      "cityAccessAffordability",
      "familyOriented",
      "investmentFocused",
      "diasporaBuyer",
    ],
    required: true,
    unique: true,
  },
  areaName: { type: String, required: true, trim: true },
  description: { type: String, default: "", trim: true },
  isActive: { type: Boolean, required: true, default: true },
});

applyBaseSchema(areaSchema);

export type AreaDocument = HydratedDocument<InferSchemaType<typeof areaSchema>>;

export const Area = model("Area", areaSchema);
