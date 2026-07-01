/**
 * Decision Engine — Phases 2-4 (see docs/ARCHITECTURE.md#1-architectural-principle-decision-engine-vs-llm-advisory-layer).
 *
 * STRICT RULE: everything in this module must be deterministic, pure, and
 * unit-tested. No network calls, no LLM calls, no randomness.
 *
 * Will own: readiness scoring, next-best-action selection, property matching,
 * budget/affordability, hidden cost aggregation, ROI projection.
 */
export {};
