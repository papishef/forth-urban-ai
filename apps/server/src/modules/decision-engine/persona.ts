import type { HomeReadinessAnswers } from "@forth-urban/validation";
import type { BuyerPersona, LeadCategory, ReadinessBand } from "@forth-urban/shared-types";

/**
 * Buyer persona + lead category selection — docs/PRODUCT_SPEC.md#5 and §14.
 *
 * `LOW_BUDGET_MAX`/`HIGH_BUDGET_MIN` are placeholder Abuja land-price tiers
 * (NGN) used only to flavor persona selection until real property price data
 * lands in Phase 3 (`properties` seed data). Revisit then.
 */
const LOW_BUDGET_MAX = 15_000_000;
const HIGH_BUDGET_MIN = 40_000_000;

/** Picks a buyer persona from the illustrative list in PRODUCT_SPEC §5. */
export function selectBuyerPersona(answers: HomeReadinessAnswers): BuyerPersona {
  if (answers.buyerGoal === "diaspora") return "Diaspora Investor";
  if (answers.buyerGoal === "investment") return "Growth Investor";

  const isHighBudget = answers.budgetRange.max >= HIGH_BUDGET_MIN;
  const isLowBudget = answers.budgetRange.max <= LOW_BUDGET_MAX;

  if (answers.buyerGoal === "firstTime") {
    return isLowBudget ? "Budget Starter" : "First-Time Ownership Builder";
  }

  // residential / family
  return isHighBudget ? "Premium Home Builder" : "First-Time Ownership Builder";
}

/**
 * Picks a CRM lead category from the segments in PRODUCT_SPEC §14
 * (Hot/Warm/Research/Diaspora/Budget starter/Investor), in priority order.
 */
export function selectLeadCategory(
  answers: HomeReadinessAnswers,
  band: ReadinessBand,
  persona: BuyerPersona,
): LeadCategory {
  if (answers.buyerGoal === "diaspora") return "diaspora";
  if (answers.buyerGoal === "investment") return "investor";
  if (persona === "Budget Starter") return "budgetStarter";
  if (band === "readyBuyer") return "hot";
  if (band === "almostReady") return "warm";
  return "research";
}
