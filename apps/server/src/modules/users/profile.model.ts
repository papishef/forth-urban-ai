import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

/**
 * `profiles` collection — see docs/ARCHITECTURE.md#5-database-schema-mongodb-atlas.
 *
 * Upserted whenever the user completes the Home-Readiness Quiz
 * (apps/server/src/modules/quiz/quiz.service.ts). Represents the user's
 * latest quiz-derived state; not a historical log (that's `quizResponses`).
 */
const profileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  buyerGoal: {
    type: String,
    enum: ["investment", "residential", "family", "diaspora", "firstTime"],
    required: true,
  },
  budgetRange: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
  },
  monthlyIncome: { type: Number, required: true },
  paymentStyle: { type: String, enum: ["oneTime", "installment"], required: true },
  timeline: {
    type: String,
    enum: ["now", "in3To6Months", "in6To12Months", "justExploring"],
    required: true,
  },
  preferredArea: { type: String, required: true, trim: true },
  lifestylePreference: {
    type: String,
    enum: ["premiumQuiet", "affordableStarter", "cityAccess", "familyFriendly", "investmentGrowth"],
    required: true,
  },
  biggestFear: {
    type: String,
    enum: ["scamFear", "documentation", "hiddenCosts", "locationConfusion", "delayedAllocation", "affordability"],
    required: true,
  },
  inspectionPreference: {
    type: String,
    enum: ["physical", "virtual", "documentReviewFirst", "advisorCallFirst"],
    required: true,
  },
  buyerPersona: { type: String, required: true },
  leadCategory: { type: String, required: true },
  readinessScore: { type: Number, required: true, min: 0, max: 100 },
});

applyBaseSchema(profileSchema);

export type ProfileDocument = HydratedDocument<InferSchemaType<typeof profileSchema>>;

export const Profile = model("Profile", profileSchema);
