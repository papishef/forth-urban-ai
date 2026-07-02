import { describe, expect, it } from "vitest";
import type { HomeReadinessAnswers } from "@forth-urban/validation";
import { scoreHomeReadiness, getReadinessBand, READINESS_BAND_LABELS, READINESS_BAND_NEXT_ACTION } from "./readiness.js";

/**
 * One fixture per readiness band (PRODUCT_SPEC §5), with the expected score
 * computed by hand from the documented rubric in readiness.ts so a change to
 * the weights is caught immediately.
 */
const readyBuyerAnswers: HomeReadinessAnswers = {
  buyerGoal: "residential",
  budgetRange: { min: 10_000_000, max: 20_000_000 },
  monthlyIncome: 5_000_000,
  paymentStyle: "installment",
  timeline: "now",
  preferredArea: "Guzape II",
  lifestylePreference: "premiumQuiet",
  biggestFear: "locationConfusion",
  inspectionPreference: "physical",
};

const almostReadyAnswers: HomeReadinessAnswers = {
  buyerGoal: "residential",
  budgetRange: { min: 15_000_000, max: 20_000_000 },
  monthlyIncome: 300_000,
  paymentStyle: "oneTime",
  timeline: "in3To6Months",
  preferredArea: "Kuje",
  lifestylePreference: "affordableStarter",
  biggestFear: "documentation",
  inspectionPreference: "advisorCallFirst",
};

const researchingBuyerAnswers: HomeReadinessAnswers = {
  buyerGoal: "family",
  budgetRange: { min: 20_000_000, max: 25_000_000 },
  monthlyIncome: 200_000,
  paymentStyle: "oneTime",
  timeline: "in6To12Months",
  preferredArea: "not sure yet",
  lifestylePreference: "familyFriendly",
  biggestFear: "scamFear",
  inspectionPreference: "documentReviewFirst",
};

const earlyStageBuyerAnswers: HomeReadinessAnswers = {
  buyerGoal: "firstTime",
  budgetRange: { min: 5_000_000, max: 8_000_000 },
  monthlyIncome: 0,
  paymentStyle: "oneTime",
  timeline: "justExploring",
  preferredArea: "undecided",
  lifestylePreference: "affordableStarter",
  biggestFear: "affordability",
  inspectionPreference: "advisorCallFirst",
};

describe("scoreHomeReadiness + getReadinessBand", () => {
  it("scores a Ready Buyer fixture at 97 and bands it readyBuyer (80-100)", () => {
    const score = scoreHomeReadiness(readyBuyerAnswers);
    expect(score).toBe(97);
    expect(getReadinessBand(score)).toBe("readyBuyer");
  });

  it("scores an Almost Ready fixture at 66 and bands it almostReady (60-79)", () => {
    const score = scoreHomeReadiness(almostReadyAnswers);
    expect(score).toBe(66);
    expect(getReadinessBand(score)).toBe("almostReady");
  });

  it("scores a Researching Buyer fixture at 41 and bands it researchingBuyer (40-59)", () => {
    const score = scoreHomeReadiness(researchingBuyerAnswers);
    expect(score).toBe(41);
    expect(getReadinessBand(score)).toBe("researchingBuyer");
  });

  it("scores an Early Stage Buyer fixture at 29 and bands it earlyStageBuyer (0-39)", () => {
    const score = scoreHomeReadiness(earlyStageBuyerAnswers);
    expect(score).toBe(29);
    expect(getReadinessBand(score)).toBe("earlyStageBuyer");
  });

  it("clamps the score to [0, 100]", () => {
    const score = scoreHomeReadiness(readyBuyerAnswers);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it.each([
    [0, "earlyStageBuyer"],
    [39, "earlyStageBuyer"],
    [40, "researchingBuyer"],
    [59, "researchingBuyer"],
    [60, "almostReady"],
    [79, "almostReady"],
    [80, "readyBuyer"],
    [100, "readyBuyer"],
  ] as const)("bands a raw score of %i as %s", (score, expectedBand) => {
    expect(getReadinessBand(score)).toBe(expectedBand);
  });
});

describe("READINESS_BAND_LABELS + READINESS_BAND_NEXT_ACTION", () => {
  it("has a human label and next action for every band", () => {
    for (const band of ["readyBuyer", "almostReady", "researchingBuyer", "earlyStageBuyer"] as const) {
      expect(READINESS_BAND_LABELS[band]).toBeTruthy();
      expect(READINESS_BAND_NEXT_ACTION[band]).toBeTruthy();
    }
  });

  it("matches the exact wording from PRODUCT_SPEC §5", () => {
    expect(READINESS_BAND_NEXT_ACTION.readyBuyer).toBe("Show matched lands + inspection scheduler");
    expect(READINESS_BAND_NEXT_ACTION.almostReady).toBe(
      "Show budget calculator + hidden cost guide before inspection",
    );
    expect(READINESS_BAND_NEXT_ACTION.researchingBuyer).toBe("Show area quiz, buying roadmap, document checklist");
    expect(READINESS_BAND_NEXT_ACTION.earlyStageBuyer).toBe(
      "Show education sequence, invite to build a readiness plan",
    );
  });
});
