/**
 * Decision Engine — Phases 2-4 (see docs/ARCHITECTURE.md#1-architectural-principle-decision-engine-vs-llm-advisory-layer).
 *
 * STRICT RULE: everything in this module must be deterministic, pure, and
 * unit-tested. No network calls, no LLM calls, no randomness.
 *
 * Phase 2: readiness scoring, buyer persona/lead category, Best Abuja Area
 * Quiz matching, next-best-action selection.
 * Will also own (Phase 3-4): property matching, budget/affordability,
 * hidden cost aggregation, ROI projection.
 */
export {
  scoreHomeReadiness,
  getReadinessBand,
  READINESS_BAND_LABELS,
  READINESS_BAND_NEXT_ACTION,
} from "./readiness.js";
export { selectBuyerPersona, selectLeadCategory } from "./persona.js";
export { matchAreaForPreference, AREA_PREFERENCE_MATCH } from "./area-matching.js";
export { selectNextBestAction } from "./next-best-action.js";
