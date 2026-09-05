import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

const mediaAssetSchema = new Schema({
  url: { type: String, required: true, trim: true, index: true },
  publicId: { type: String, default: null, trim: true },
  kind: { type: String, enum: ["image", "video", "document"], required: true },
  mimeType: { type: String, required: true, trim: true },
  sizeBytes: { type: Number, required: true, min: 1 },
  ownerType: { type: String, enum: ["blog", "property"], required: true, index: true },
  ownerId: { type: Schema.Types.ObjectId, required: true, index: true },
});

applyBaseSchema(mediaAssetSchema);

export type MediaAssetDocument = HydratedDocument<InferSchemaType<typeof mediaAssetSchema>>;

export const MediaAsset = model("MediaAsset", mediaAssetSchema);