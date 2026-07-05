import type { BuyerGoal, InspectionType, RoiScenarioKeyInput } from "@forth-urban/validation";
import { ApiError } from "../../middleware/error-handler.js";
import {
  calculateRoi,
  getInspectionChecklist,
  getReadinessBand,
  READINESS_BAND_LABELS,
  selectNextBestAction,
} from "../decision-engine/index.js";
import { Profile, type ProfileDocument } from "../users/profile.model.js";
import { Property, type PropertyDocument } from "../properties/property.model.js";
import { Recommendation } from "../properties/recommendation.model.js";
import { CalculatorResult } from "../calculators/calculator-result.model.js";

/**
 * Context builders — docs/ARCHITECTURE.md#3-ai-memory-strategy-no-vector-db.
 *
 * Assembles the structured JSON handed to `AIAdvisoryService.generate()` for
 * each prompt, straight from the user's own Mongo documents (no RAG/vector
 * DB). Every builder only reads data the Decision Engine already produced —
 * none of them compute anything themselves.
 */

async function requireProfile(userId: string): Promise<ProfileDocument> {
  const profile = await Profile.findOne({ userId });
  if (!profile) throw new ApiError(404, "Complete the Home-Readiness Quiz first");
  return profile;
}

async function loadProperty(propertyId: string): Promise<PropertyDocument> {
  const property = await Property.findById(propertyId);
  if (!property) throw new ApiError(404, "Property not found");
  return property;
}

export async function buildQuizSummaryContext(userId: string): Promise<Record<string, unknown>> {
  const profile = await requireProfile(userId);
  const band = getReadinessBand(profile.readinessScore);

  return {
    readinessScore: profile.readinessScore,
    resultType: READINESS_BAND_LABELS[band],
    buyerGoal: profile.buyerGoal,
    budgetRange: profile.budgetRange,
    timeline: profile.timeline,
    biggestFear: profile.biggestFear,
    nextAction: selectNextBestAction("homeReadinessQuizCompleted"),
  };
}

export async function buildBuyerPersonaContext(userId: string): Promise<Record<string, unknown>> {
  const profile = await requireProfile(userId);

  return {
    buyerPersona: profile.buyerPersona,
    readinessScore: profile.readinessScore,
    buyerGoal: profile.buyerGoal,
    timeline: profile.timeline,
    paymentStyle: profile.paymentStyle,
  };
}

export async function buildRecommendationContext(userId: string, propertyId: string): Promise<Record<string, unknown>> {
  const property = await loadProperty(propertyId);
  const [recommendation, profile] = await Promise.all([
    Recommendation.findOne({ userId, propertyId: property._id }),
    Profile.findOne({ userId }),
  ]);

  return {
    propertyName: property.name,
    estateName: property.estateName,
    reasonTags: recommendation?.reasonTags ?? [],
    budgetRange: profile?.budgetRange ?? null,
    buyerPersona: profile?.buyerPersona ?? null,
    nextAction: selectNextBestAction("propertyCardViewed"),
  };
}

export async function buildRoiExplainerContext(
  propertyId: string,
  years: number,
  scenario: RoiScenarioKeyInput,
): Promise<Record<string, unknown>> {
  const property = await loadProperty(propertyId);
  const roiAssumptions = property.roiAssumptions!;

  const scenarios = calculateRoi(property.pricePerPlot, years, {
    conservative: roiAssumptions.conservative,
    moderate: roiAssumptions.moderate,
    optimistic: roiAssumptions.optimistic,
  });
  const selected = scenarios[scenario];

  return {
    currentPrice: property.pricePerPlot,
    scenario,
    annualAppreciationRate: selected.rate,
    years,
    futureValue: selected.futureValue,
    estimatedGain: selected.estimatedGain,
    roiPercent: selected.roiPercent,
    nextAction: selectNextBestAction("roiCalculatorRun"),
  };
}

export async function buildInspectionAdviceContext(
  userId: string,
  propertyId: string,
  inspectionType: InspectionType,
): Promise<Record<string, unknown>> {
  const property = await loadProperty(propertyId);
  const profile = await Profile.findOne({ userId });

  return {
    inspectionType,
    mainConcern: profile?.biggestFear ?? "documentation",
    propertyName: property.name,
    checklist: getInspectionChecklist(),
    nextAction: selectNextBestAction("inspectionChecklistDownloaded"),
  };
}

/** Subset of fields safe to hand to the LLM for a recommended property — never the full inventory. */
interface AskRecommendedProperty {
  name: string;
  estateName: string;
  reasonTags: string[];
}

export async function buildAskContext(userId: string, question: string): Promise<Record<string, unknown>> {
  const profile = await requireProfile(userId);
  const band = getReadinessBand(profile.readinessScore);

  const [latestBudget, latestHiddenCost, latestRoi, recommendations] = await Promise.all([
    CalculatorResult.findOne({ userId, type: "budget" }).sort({ createdAt: -1 }),
    CalculatorResult.findOne({ userId, type: "hiddenCost" }).sort({ createdAt: -1 }),
    CalculatorResult.findOne({ userId, type: "roi" }).sort({ createdAt: -1 }),
    Recommendation.find({ userId }).sort({ score: -1 }).limit(3).populate<{ propertyId: PropertyDocument }>(
      "propertyId",
    ),
  ]);

  const recommendedProperties: AskRecommendedProperty[] = recommendations
    .filter((rec) => rec.propertyId)
    .map((rec) => ({
      name: rec.propertyId.name,
      estateName: rec.propertyId.estateName,
      reasonTags: rec.reasonTags,
    }));

  return {
    question,
    profileSummary: {
      readinessScore: profile.readinessScore,
      resultType: READINESS_BAND_LABELS[band],
      buyerPersona: profile.buyerPersona,
      buyerGoal: profile.buyerGoal as BuyerGoal,
      budgetRange: profile.budgetRange,
      timeline: profile.timeline,
      preferredArea: profile.preferredArea,
      biggestFear: profile.biggestFear,
      latestBudgetResult: latestBudget?.outputs ?? null,
      latestHiddenCostResult: latestHiddenCost?.outputs ?? null,
      latestRoiResult: latestRoi?.outputs ?? null,
      recommendedProperties,
      nextAction: selectNextBestAction("homeReadinessQuizCompleted"),
    },
  };
}
