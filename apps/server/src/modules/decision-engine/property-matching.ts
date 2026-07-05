import type { BuyerGoal, LifestylePreference, PaymentStyle } from "@forth-urban/validation";
import type { DevelopmentStatus } from "@forth-urban/shared-types";

/**
 * Property matching — docs/PRODUCT_SPEC.md#7-property-recommendation-engine
 *
 * Like readiness.ts, the spec names the filter/score criteria (budget,
 * preferred area, buyer goal, timeline, lifestyle, payment style) but does
 * not prescribe exact weights. This rubric is a first-pass, fully documented
 * and deterministic scoring model; revisit the weights once real conversion
 * data is available. Pure and unit-tested — no I/O, no LLM.
 */

export interface PropertyMatchCandidate {
  id: string;
  pricePerPlot: number;
  location: { address: string; landmarks: string[] };
  bestFitBuyerTypes: BuyerGoal[];
  paymentPlanTypes: Array<"oneTime" | "installment">;
  developmentStatus: DevelopmentStatus;
}

export interface PropertyMatchProfile {
  budgetRange: { min: number; max: number };
  preferredArea: string;
  buyerGoal: BuyerGoal;
  paymentStyle: PaymentStyle;
  lifestylePreference: LifestylePreference;
}

export interface PropertyMatchResult {
  propertyId: string;
  score: number;
  reasonTags: string[];
}

/**
 * Default weights — admin-editable in Phase 7 via `modules/settings`
 * (`Settings.propertyMatchWeights`), passed in as `weightsOverride` below.
 * Exported so the settings default doc can seed from the same values.
 */
export const DEFAULT_PROPERTY_MATCH_WEIGHTS = {
  budget: 40,
  area: 25,
  buyerGoal: 20,
  paymentStyle: 10,
  lifestyle: 5,
};

export type PropertyMatchWeights = typeof DEFAULT_PROPERTY_MATCH_WEIGHTS;

const BUYER_GOAL_LABELS: Record<BuyerGoal, string> = {
  investment: "investment",
  residential: "residential",
  family: "family",
  diaspora: "diaspora",
  firstTime: "first-time",
};

/**
 * Illustrative area hint per lifestyle preference, mirroring
 * area-matching.ts's AREA_PREFERENCE_MATCH. Not a hardcoded requirement —
 * only used as an extra scoring signal when a property's location happens to
 * mention the hinted area.
 */
const LIFESTYLE_AREA_HINTS: Record<LifestylePreference, string> = {
  premiumQuiet: "guzape",
  affordableStarter: "kuje",
  cityAccess: "lugbe",
  familyFriendly: "lokogoma",
  investmentGrowth: "lugbe",
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function locationMentions(location: PropertyMatchCandidate["location"], needle: string): boolean {
  const target = normalize(needle);
  if (!target) return false;
  const haystacks = [location.address, ...location.landmarks].map(normalize);
  return haystacks.some((haystack) => haystack.includes(target) || target.includes(haystack));
}

/**
 * Scores and tags every candidate property for a user's profile, returning
 * only properties with at least one match, sorted best-first. Callers
 * (properties module) attach the full property data for the API response.
 */
export function matchProperties(
  profile: PropertyMatchProfile,
  properties: PropertyMatchCandidate[],
  weightsOverride?: Partial<PropertyMatchWeights>,
): PropertyMatchResult[] {
  const weights = { ...DEFAULT_PROPERTY_MATCH_WEIGHTS, ...weightsOverride };

  return properties
    .map((property): PropertyMatchResult => {
      let score = 0;
      const reasonTags: string[] = [];

      const { min, max } = profile.budgetRange;
      if (property.pricePerPlot >= min && property.pricePerPlot <= max) {
        score += weights.budget;
        reasonTags.push("Matches your budget");
      }

      if (locationMentions(property.location, profile.preferredArea)) {
        score += weights.area;
        reasonTags.push("In your preferred area");
      }

      if (property.bestFitBuyerTypes.includes(profile.buyerGoal)) {
        score += weights.buyerGoal;
        reasonTags.push(`Suits ${BUYER_GOAL_LABELS[profile.buyerGoal]} buyers`);
      }

      if (property.paymentPlanTypes.includes(profile.paymentStyle)) {
        score += weights.paymentStyle;
        reasonTags.push(
          profile.paymentStyle === "installment" ? "Supports installment payment" : "Supports one-time payment",
        );
      }

      if (locationMentions(property.location, LIFESTYLE_AREA_HINTS[profile.lifestylePreference])) {
        score += weights.lifestyle;
        reasonTags.push("Fits your preferred lifestyle");
      }

      return { propertyId: property.id, score, reasonTags };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);
}
