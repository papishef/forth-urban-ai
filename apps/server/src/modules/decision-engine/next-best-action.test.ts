import { describe, expect, it } from "vitest";
import type { NextActionTrigger } from "@forth-urban/shared-types";
import { selectNextBestAction } from "./next-best-action.js";

describe("selectNextBestAction", () => {
  it("maps homeReadinessQuizCompleted per PRODUCT_SPEC §6", () => {
    expect(selectNextBestAction("homeReadinessQuizCompleted")).toEqual({
      trigger: "homeReadinessQuizCompleted",
      action: "View matched available lands",
      reason: "Needs options fitting result",
    });
  });

  it("maps areaQuizCompleted per PRODUCT_SPEC §6", () => {
    expect(selectNextBestAction("areaQuizCompleted")).toEqual({
      trigger: "areaQuizCompleted",
      action: "View available land in recommended area",
      reason: "Converts clarity to shortlist",
    });
  });

  it("maps quizAbandoned to a recovery email reminder", () => {
    const result = selectNextBestAction("quizAbandoned");
    expect(result.action).toBe("Email reminder to continue");
  });

  it("returns a non-empty action and reason for every trigger in the table", () => {
    const triggers: NextActionTrigger[] = [
      "homeReadinessQuizCompleted",
      "propertyCardViewed",
      "budgetCalculatorUsed",
      "hiddenCostGuideViewed",
      "roiCalculatorRun",
      "areaQuizCompleted",
      "inspectionChecklistDownloaded",
      "quizAbandoned",
      "propertyViewedTwice",
    ];
    for (const trigger of triggers) {
      const result = selectNextBestAction(trigger);
      expect(result.trigger).toBe(trigger);
      expect(result.action).toBeTruthy();
      expect(result.reason).toBeTruthy();
    }
  });
});
