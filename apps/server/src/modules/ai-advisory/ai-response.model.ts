import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

/**
 * `aiResponses` collection — docs/ARCHITECTURE.md#llm-advisory-layer-appsserversrcmodulesai-advisory.
 *
 * Persists every LLM Advisory Layer call so behavior changes are traceable
 * per prompt version ("the advisory service loads by key, logs
 * promptVersion used per call (stored on the AI response record)"), and so
 * CRM/support can see exactly what a user was told. `context` is a snapshot
 * of the structured JSON sent to the provider — never the raw provider
 * request/response, and never anything the LLM computed itself (that would
 * contradict the Decision-Engine-owns-numbers rule).
 */
const aiResponseSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  promptKey: {
    type: String,
    enum: ["quiz-summary", "recommendation", "buyer-persona", "inspection-advice", "roi-explainer", "ask"],
    required: true,
  },
  promptVersion: { type: String, required: true },
  provider: { type: String, required: true },
  degraded: { type: Boolean, required: true, default: false },
  context: { type: Schema.Types.Mixed, required: true },
  text: { type: String, required: true },
});

aiResponseSchema.index({ userId: 1, promptKey: 1, createdAt: -1 });

applyBaseSchema(aiResponseSchema);

export type AiResponseDocument = HydratedDocument<InferSchemaType<typeof aiResponseSchema>>;

export const AiResponse = model("AiResponse", aiResponseSchema);
