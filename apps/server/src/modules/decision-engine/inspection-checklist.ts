/**
 * Auto-generated inspection checklist — docs/PRODUCT_SPEC.md#11-site-inspection-scheduler-the-conversion-event.
 *
 * A fixed, deterministic list (not LLM-generated) shown before a booked
 * inspection. Lives in the Decision Engine — not ai-advisory — because it is
 * fixed content, not something the LLM invents; the Phase 5 inspection-advice
 * prompt is only allowed to restate these exact items. Phase 6 will attach
 * this same list to `inspectionBookings` documents.
 */
export const INSPECTION_CHECKLIST: readonly string[] = [
  "Confirm the estate name, location, and access route",
  "Ask about the title and documentation process",
  "Ask about the allocation timeline",
  "Ask about development levy and future charges",
  "Inspect road access and surrounding development",
  "Ask what happens after the first payment",
  "Request a written payment breakdown",
  "Confirm which documents you receive after payment",
];

/** Returns the deterministic inspection-prep checklist (PRODUCT_SPEC §11). */
export function getInspectionChecklist(): readonly string[] {
  return INSPECTION_CHECKLIST;
}
