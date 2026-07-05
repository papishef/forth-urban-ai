import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

/**
 * `properties` collection — see docs/ARCHITECTURE.md#5-database-schema-mongodb-atlas
 * and docs/PRODUCT_SPEC.md#7-property-recommendation-engine.
 *
 * `titleType`/`documentationStatus`/`location.address` are free-form strings
 * rather than hardcoded enums (AGENTS.md rule #9 — multi-tenant/multi-city
 * readiness): Abuja-specific title types and area names are data, not code.
 */
const paymentPlanSchema = new Schema(
  {
    type: { type: String, enum: ["oneTime", "installment"], required: true },
    label: { type: String, required: true, trim: true },
    minDownPaymentPercent: { type: Number, default: null },
    maxDurationMonths: { type: Number, default: null },
  },
  { _id: false },
);

const hiddenCostRuleSchema = new Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    applicable: { type: Boolean, required: true, default: true },
  },
  { _id: false },
);

const propertySchema = new Schema({
  name: { type: String, required: true, trim: true },
  estateName: { type: String, required: true, trim: true },
  location: {
    address: { type: String, required: true, trim: true },
    landmarks: { type: [String], default: [] },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  pricePerPlot: { type: Number, required: true, min: 0 },
  plotSizes: { type: [String], required: true, default: [] },
  titleType: { type: String, required: true, trim: true },
  documentationStatus: { type: String, required: true, trim: true },
  paymentPlans: { type: [paymentPlanSchema], required: true, default: [] },
  bestFitBuyerTypes: {
    type: [String],
    enum: ["investment", "residential", "family", "diaspora", "firstTime"],
    required: true,
    default: [],
  },
  developmentStatus: {
    type: String,
    enum: ["serviced", "developing", "planned", "completed"],
    required: true,
  },
  inspectionAvailability: {
    physical: { type: Boolean, required: true, default: true },
    virtual: { type: Boolean, required: true, default: true },
  },
  hiddenCostRules: { type: [hiddenCostRuleSchema], required: true, default: [] },
  roiAssumptions: {
    conservative: { type: Number, required: true, default: 0.05 },
    moderate: { type: Number, required: true, default: 0.1 },
    optimistic: { type: Number, required: true, default: 0.15 },
  },
  media: {
    photos: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    googleMapsUrl: { type: String, default: null },
    brochureUrl: { type: String, default: null },
    titleDocuments: { type: [String], default: [] },
  },
  isActive: { type: Boolean, required: true, default: true },
});

propertySchema.index({ "location.landmarks": "text", "location.address": "text" });
propertySchema.index({ isActive: 1 });

applyBaseSchema(propertySchema);

export type PropertyDocument = HydratedDocument<InferSchemaType<typeof propertySchema>>;

export const Property = model("Property", propertySchema);
