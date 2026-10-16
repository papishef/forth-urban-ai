import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

const storagePaymentSchema = new Schema({
  planId: {
    type: String,
    enum: ["starter_5gb", "growth_50gb", "scale_200gb"],
    required: true,
  },
  amountNaira: { type: Number, required: true, min: 1 },
  currency: { type: String, required: true, default: "NGN" },
  txRef: { type: String, required: true, unique: true, index: true },
  transactionId: { type: String, default: null, index: true },
  status: { type: String, enum: ["pending", "successful", "failed"], required: true, default: "pending" },
  customerEmail: { type: String, required: true, trim: true, lowercase: true },
  rawResponse: { type: Schema.Types.Mixed, default: null },
});

applyBaseSchema(storagePaymentSchema);

export type StoragePaymentDocument = HydratedDocument<InferSchemaType<typeof storagePaymentSchema>>;

export const StoragePayment = model("StoragePayment", storagePaymentSchema);