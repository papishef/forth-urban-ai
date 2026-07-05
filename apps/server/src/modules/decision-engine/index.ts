/**
 * Decision Engine — Phases 2-4 (see docs/ARCHITECTURE.md#1-architectural-principle-decision-engine-vs-llm-advisory-layer).
 *
 * STRICT RULE: everything in this module must be deterministic, pure, and
 * unit-tested. No network calls, no LLM calls, no randomness.
 *
 * Phase 2: readiness scoring, buyer persona/lead category, Best Abuja Area
 * Quiz matching, next-best-action selection.
 * Phase 3: property matching (budget/area/buyer goal/payment style/lifestyle).
 * Phase 4: budget/affordability, hidden cost aggregation, ROI projection.
 */
export {
  scoreHomeReadiness,
  getReadinessBand,
  READINESS_BAND_LABELS,
  READINESS_BAND_NEXT_ACTION,
} from "./readiness.js";
export { selectBuyerPersona, selectLeadCategory } from "./persona.js";
export { matchAreaForPreference, AREA_PREFERENCE_MATCH } from "./area-matching.js";
export { selectNextBestAction, selectHiddenCostNextAction } from "./next-best-action.js";
export { getInspectionChecklist, INSPECTION_CHECKLIST } from "./inspection-checklist.js";
export {
  matchProperties,
  DEFAULT_PROPERTY_MATCH_WEIGHTS,
  type PropertyMatchCandidate,
  type PropertyMatchProfile,
  type PropertyMatchResult,
  type PropertyMatchWeights,
} from "./property-matching.js";
export {
  calculateBudget,
  getAffordabilityAdvice,
  AFFORDABILITY_BAND_LABELS,
  aggregateHiddenCosts,
  calculateRoi,
  type BudgetCalculationInput,
  type BudgetCalculationResult,
  type HiddenCostRuleInput,
  type HiddenCostAggregationResult,
  type RoiAssumptions,
  type RoiScenarioResult,
  type RoiCalculationResult,
} from "./calculators.js";
