import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

/**
 * `inspectionBookings` collection — docs/ARCHITECTURE.md#5-database-schema-mongodb-atlas.
 *
 * The single conversion event of the funnel (PRODUCT_SPEC §11). Either
 * `propertyId` (a specific matched land) or `recommendedArea` (from the Best
 * Abuja Area Quiz) is set — validated at the API layer
 * (packages/validation `inspectionBookingInputSchema`), not enforced here,
 * since Mongoose doesn't cleanly express "at least one of" constraints.
 */
const inspectionBookingSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  propertyId: { type: Schema.Types.ObjectId, ref: "Property", default: null },
  recommendedArea: { type: String, default: null, trim: true },
  inspectionType: { type: String, enum: ["physical", "virtual"], required: true },
  preferredDate: { type: Date, required: true },
  preferredTime: { type: String, required: true, trim: true },
  mainConcern: {
    type: String,
    enum: ["scamFear", "documentation", "hiddenCosts", "locationConfusion", "delayedAllocation", "affordability"],
    required: true,
  },
  wantsDocsBeforeInspection: { type: Boolean, required: true, default: false },
  status: { type: String, enum: ["pending", "confirmed", "completed", "cancelled"], required: true, default: "pending" },
  assignedSalesRep: { type: Schema.Types.ObjectId, ref: "User", default: null },
  checklist: { type: [String], required: true, default: [] },
  whatsappLink: { type: String, required: true },
});

inspectionBookingSchema.index({ status: 1, preferredDate: 1 });

applyBaseSchema(inspectionBookingSchema);

export type InspectionBookingDocument = HydratedDocument<InferSchemaType<typeof inspectionBookingSchema>>;

export const InspectionBooking = model("InspectionBooking", inspectionBookingSchema);
