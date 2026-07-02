import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

/**
 * `quizResponses` collection — see docs/ARCHITECTURE.md#5-database-schema-mongodb-atlas.
 *
 * A historical log of completed quiz submissions (Home-Readiness + Best
 * Abuja Area), used for CRM/sales context and abandonment detection
 * (compare `quiz.started` vs `quiz.completed` audit log entries). The
 * user's *current* state lives in `profiles`, not here.
 */
const quizAnswerEntrySchema = new Schema(
  {
    questionKey: { type: String, required: true },
    answer: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false },
);

const quizResponseSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  quizType: { type: String, enum: ["homeReadiness", "area"], required: true },
  answers: { type: [quizAnswerEntrySchema], required: true },
  readinessScore: { type: Number, default: null },
  resultType: { type: String, required: true },
  completedAt: { type: Date, required: true },
});

quizResponseSchema.index({ userId: 1, quizType: 1, completedAt: -1 });

applyBaseSchema(quizResponseSchema);

export type QuizResponseDocument = HydratedDocument<InferSchemaType<typeof quizResponseSchema>>;

export const QuizResponse = model("QuizResponse", quizResponseSchema);
