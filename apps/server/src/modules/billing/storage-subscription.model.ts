import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

const storageSubscriptionSchema = new Schema({
  key: { type: String, required: true, unique: true, default: "global" },
  planId: {
    type: String,
    enum: ["free", "starter_5gb", "growth_50gb", "scale_200gb"],
    required: true,
    default: "free",
  },
  storageBytes: { type: Number, required: true, default: 50 * 1024 * 1024 },
  status: {
    type: String,
    enum: ["active", "past_due", "canceled"],
    required: true,
    default: "active",
  },
  autoRenew: { type: Boolean, required: true, default: true },
  currentPeriodEnd: { type: Date, default: null },
  lastPaymentAt: { type: Date, default: null },
  lastPaymentStatus: { type: String, enum: ["pending", "successful", "failed"], default: null },
  flutterwave: {
    customerEmail: { type: String, default: null },
    cardToken: { type: String, default: null },
    lastTransactionId: { type: String, default: null },
    lastTransactionRef: { type: String, default: null },
    subscriptionRef: { type: String, default: null },
  },
});

applyBaseSchema(storageSubscriptionSchema);

export type StorageSubscriptionDocument = HydratedDocument<InferSchemaType<typeof storageSubscriptionSchema>>;

export const StorageSubscription = model("StorageSubscription", storageSubscriptionSchema);