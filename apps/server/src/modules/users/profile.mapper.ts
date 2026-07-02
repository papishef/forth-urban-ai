import type { ProfileDTO } from "@forth-urban/shared-types";
import type { ProfileDocument } from "./profile.model.js";

/** Maps a Mongoose Profile document to the client-safe DTO. */
export function toProfileDTO(profile: ProfileDocument): ProfileDTO {
  return {
    id: profile._id.toString(),
    buyerGoal: profile.buyerGoal,
    budgetRange: { min: profile.budgetRange!.min, max: profile.budgetRange!.max },
    monthlyIncome: profile.monthlyIncome,
    paymentStyle: profile.paymentStyle,
    timeline: profile.timeline,
    preferredArea: profile.preferredArea,
    lifestylePreference: profile.lifestylePreference,
    biggestFear: profile.biggestFear,
    inspectionPreference: profile.inspectionPreference,
    buyerPersona: profile.buyerPersona as ProfileDTO["buyerPersona"],
    leadCategory: profile.leadCategory as ProfileDTO["leadCategory"],
    readinessScore: profile.readinessScore,
    updatedAt: (profile.get("updatedAt") as Date).toISOString(),
  };
}
