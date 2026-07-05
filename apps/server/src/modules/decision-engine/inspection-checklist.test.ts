import { describe, expect, it } from "vitest";
import { getInspectionChecklist, INSPECTION_CHECKLIST } from "./inspection-checklist.js";

describe("getInspectionChecklist", () => {
  it("returns the fixed 8-item checklist from PRODUCT_SPEC §11 verbatim", () => {
    const checklist = getInspectionChecklist();
    expect(checklist).toBe(INSPECTION_CHECKLIST);
    expect(checklist).toHaveLength(8);
    expect(checklist).toEqual([
      "Confirm the estate name, location, and access route",
      "Ask about the title and documentation process",
      "Ask about the allocation timeline",
      "Ask about development levy and future charges",
      "Inspect road access and surrounding development",
      "Ask what happens after the first payment",
      "Request a written payment breakdown",
      "Confirm which documents you receive after payment",
    ]);
  });

  it("returns the same reference on every call (deterministic, no randomness)", () => {
    expect(getInspectionChecklist()).toBe(getInspectionChecklist());
  });
});
