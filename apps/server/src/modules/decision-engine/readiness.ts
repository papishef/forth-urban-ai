import type { HomeReadinessAnswers } from "@forth-urban/validation";
import type { ReadinessBand } from "@forth-urban/shared-types";

/**
 * Readiness scoring — docs/PRODUCT_SPEC.md#5-ai-recommendation-output-decision-engine-result-explained-by-llm
 *
 * The spec mandates a "weighted formula over quiz answers -> score 0-100 ->
 * band" but does not prescribe exact weights. The rubric below is a
 * first-pass, fully documented and deterministic scoring model (every
 * component maps a specific answer to a fixed point value) designed so each
 * band is reachable by a plausible combination of answers. Revisit the
 * weights once real conversion data is available.
 */

const TIMELINE_POINTS: Record<HomeReadinessAnswers["timeline"], number> = {
  now: 30,
  in3To6Months: 22,
  in6To12Months: 13,
  justExploring: 4,
};

/**
 * Affordability confidence, expressed as "years of stated monthly income
 * needed to cover the low end of the buyer's budget range". Fewer years
 * needed => higher confidence. This intentionally does not depend on a
 * selected property/installment duration (that's the Budget Calculator,
 * Phase 4) — it's a readiness signal only.
 */
function affordabilityPoints(answers: HomeReadinessAnswers): number {
  const { monthlyIncome, budgetRange } = answers;
  if (monthlyIncome <= 0 || budgetRange.min <= 0) return 3;

  const yearsOfIncomeNeeded = budgetRange.min / (monthlyIncome * 12);
  if (yearsOfIncomeNeeded <= 2) return 25;
  if (yearsOfIncomeNeeded <= 4) return 18;
  if (yearsOfIncomeNeeded <= 7) return 10;
  return 3;
}

// Fears rooted in "we just haven't explained it yet" are easier to resolve
// via education than structural fears like affordability or trust.
const FEAR_POINTS: Record<HomeReadinessAnswers["biggestFear"], number> = {
  affordability: 3,
  scamFear: 6,
  documentation: 8,
  hiddenCosts: 10,
  delayedAllocation: 10,
  locationConfusion: 12,
};

const INSPECTION_PREFERENCE_POINTS: Record<HomeReadinessAnswers["inspectionPreference"], number> = {
  physical: 10,
  virtual: 10,
  documentReviewFirst: 6,
  advisorCallFirst: 6,
};

// Any clear payment-style answer signals decisiveness; the enum has no
// "unsure" option, so this contributes a flat baseline.
const PAYMENT_STYLE_POINTS = 10;

function areaSpecificityPoints(preferredArea: string): number {
  const normalized = preferredArea.trim().toLowerCase();
  const undecidedPhrases = ["not sure", "undecided", "don't know", "dont know", "no idea", "unsure"];
  if (!normalized || undecidedPhrases.some((phrase) => normalized.includes(phrase))) return 3;
  return 10;
}

/** Computes the 0-100 readiness score for a completed Home-Readiness Quiz. */
export function scoreHomeReadiness(answers: HomeReadinessAnswers): number {
  const score =
    TIMELINE_POINTS[answers.timeline] +
    affordabilityPoints(answers) +
    PAYMENT_STYLE_POINTS +
    FEAR_POINTS[answers.biggestFear] +
    INSPECTION_PREFERENCE_POINTS[answers.inspectionPreference] +
    areaSpecificityPoints(answers.preferredArea);

  return Math.max(0, Math.min(100, Math.round(score)));
}

const BAND_THRESHOLDS: Array<{ min: number; band: ReadinessBand }> = [
  { min: 80, band: "readyBuyer" },
  { min: 60, band: "almostReady" },
  { min: 40, band: "researchingBuyer" },
  { min: 0, band: "earlyStageBuyer" },
];

/** Maps a 0-100 score to its readiness band per the PRODUCT_SPEC §5 table. */
export function getReadinessBand(score: number): ReadinessBand {
  const match = BAND_THRESHOLDS.find((entry) => score >= entry.min);
  return match?.band ?? "earlyStageBuyer";
}

export const READINESS_BAND_LABELS: Record<ReadinessBand, string> = {
  readyBuyer: "Ready Buyer",
  almostReady: "Almost Ready",
  researchingBuyer: "Researching Buyer",
  earlyStageBuyer: "Early Stage Buyer",
};

/** Next action per band, verbatim from the PRODUCT_SPEC §5 table. */
export const READINESS_BAND_NEXT_ACTION: Record<ReadinessBand, string> = {
  readyBuyer: "Show matched lands + inspection scheduler",
  almostReady: "Show budget calculator + hidden cost guide before inspection",
  researchingBuyer: "Show area quiz, buying roadmap, document checklist",
  earlyStageBuyer: "Show education sequence, invite to build a readiness plan",
};
