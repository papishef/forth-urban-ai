import type { BuyerGoal, LifestylePreference, PaymentStyle } from "@forth-urban/validation";
import type { NextActionDTO, PropertyDetailDTO, PropertyListItemDTO, RecommendedPropertyDTO } from "@forth-urban/shared-types";
import { ApiError } from "../../middleware/error-handler.js";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import { matchProperties, selectNextBestAction, type PropertyMatchCandidate } from "../decision-engine/index.js";
import { getSettings } from "../settings/index.js";
import { Profile } from "../users/profile.model.js";
import { Property, type PropertyDocument } from "./property.model.js";
import { Recommendation } from "./recommendation.model.js";
import { toPropertyDTO, toPropertyListItemDTO } from "./property.mapper.js";

/** Lists all active properties, most recently added first (catalogue browsing, no personalization). */
export async function listProperties(): Promise<PropertyListItemDTO[]> {
  const properties = await Property.find({ isActive: true }).sort({ createdAt: -1 });
  return properties.map(toPropertyListItemDTO);
}

/** Fetches a single property and the deterministic next-best-action for viewing a property card. */
export async function getPropertyById(userId: string, propertyId: string): Promise<PropertyDetailDTO> {
  const property = await Property.findById(propertyId);
  if (!property) throw new ApiError(404, "Property not found");

  await recordAuditLog({
    actorId: userId,
    actorType: "user",
    action: "property.viewed",
    targetType: "Property",
    targetId: propertyId,
  });

  const nextAction: NextActionDTO = selectNextBestAction("propertyCardViewed");

  return { property: toPropertyDTO(property), nextAction };
}

function toMatchCandidate(property: PropertyDocument): PropertyMatchCandidate {
  const location = property.location!;
  return {
    id: property._id.toString(),
    pricePerPlot: property.pricePerPlot,
    location: { address: location.address, landmarks: location.landmarks ?? [] },
    bestFitBuyerTypes: property.bestFitBuyerTypes as BuyerGoal[],
    paymentPlanTypes: [...new Set(property.paymentPlans.map((plan) => plan.type as "oneTime" | "installment"))],
    developmentStatus: property.developmentStatus,
  };
}

/**
 * Runs the Decision Engine's property matching against the user's profile
 * (populated by the Home-Readiness Quiz), persists the results to
 * `recommendations` for CRM/history, and returns them for the client.
 */
export async function getRecommendedProperties(userId: string): Promise<RecommendedPropertyDTO[]> {
  const profile = await Profile.findOne({ userId });
  if (!profile) throw new ApiError(404, "Complete the Home-Readiness Quiz to see matched properties");

  const properties = await Property.find({ isActive: true });
  const candidates = properties.map(toMatchCandidate);

  const budgetRange = profile.budgetRange!;
  const settings = await getSettings();
  const matches = matchProperties(
    {
      budgetRange: { min: budgetRange.min, max: budgetRange.max },
      preferredArea: profile.preferredArea,
      buyerGoal: profile.buyerGoal as BuyerGoal,
      paymentStyle: profile.paymentStyle as PaymentStyle,
      lifestylePreference: profile.lifestylePreference as LifestylePreference,
    },
    candidates,
    settings.propertyMatchWeights,
  );

  const propertiesById = new Map(properties.map((property) => [property._id.toString(), property]));

  await Promise.all(
    matches.map((match) =>
      Recommendation.findOneAndUpdate(
        { userId, propertyId: match.propertyId },
        { userId, propertyId: match.propertyId, reasonTags: match.reasonTags, score: match.score, source: "quiz" },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ),
    ),
  );

  await recordAuditLog({
    actorId: userId,
    actorType: "user",
    action: "property.recommended",
    targetType: "Property",
    metadata: { count: matches.length },
  });

  return matches.map((match) => ({
    property: toPropertyListItemDTO(propertiesById.get(match.propertyId)!),
    score: match.score,
    reasonTags: match.reasonTags,
  }));
}
