import { describe, expect, it } from "vitest";
import { matchProperties, type PropertyMatchCandidate, type PropertyMatchProfile } from "./property-matching.js";

function baseProfile(overrides: Partial<PropertyMatchProfile> = {}): PropertyMatchProfile {
  return {
    budgetRange: { min: 10_000_000, max: 20_000_000 },
    preferredArea: "Kuje",
    buyerGoal: "firstTime",
    paymentStyle: "installment",
    lifestylePreference: "affordableStarter",
    ...overrides,
  };
}

function property(overrides: Partial<PropertyMatchCandidate> = {}): PropertyMatchCandidate {
  return {
    id: "prop-1",
    pricePerPlot: 15_000_000,
    location: { address: "Kuje, Abuja", landmarks: ["Kuje Market"] },
    bestFitBuyerTypes: ["firstTime"],
    paymentPlanTypes: ["installment", "oneTime"],
    developmentStatus: "developing",
    ...overrides,
  };
}

describe("matchProperties", () => {
  it("scores a property matching every criterion at the maximum weight", () => {
    const [result] = matchProperties(baseProfile(), [property()]);
    expect(result!.score).toBe(100);
    expect(result!.reasonTags).toEqual([
      "Matches your budget",
      "In your preferred area",
      "Suits first-time buyers",
      "Supports installment payment",
      "Fits your preferred lifestyle",
    ]);
  });

  it("excludes properties priced outside the buyer's budget range", () => {
    const results = matchProperties(baseProfile(), [property({ pricePerPlot: 50_000_000, id: "too-expensive" })]);
    const match = results.find((r) => r.propertyId === "too-expensive");
    expect(match?.reasonTags).not.toContain("Matches your budget");
  });

  it("matches area by a partial, case-insensitive landmark/address overlap", () => {
    const results = matchProperties(
      baseProfile({ preferredArea: "kuje" }),
      [property({ location: { address: "Plot 4, Kuje District, Abuja", landmarks: [] } })],
    );
    expect(results[0]!.reasonTags).toContain("In your preferred area");
  });

  it("does not credit a buyer-goal match when the property doesn't list it", () => {
    const results = matchProperties(baseProfile({ buyerGoal: "investment" }), [property()]);
    expect(results[0]?.reasonTags ?? []).not.toContain("Suits investment buyers");
  });

  it("does not credit a payment-style match the property doesn't support", () => {
    const results = matchProperties(baseProfile(), [property({ paymentPlanTypes: ["oneTime"] })]);
    expect(results[0]!.reasonTags).not.toContain("Supports installment payment");
  });

  it("filters out properties that score zero on every criterion", () => {
    const results = matchProperties(baseProfile(), [
      property({
        pricePerPlot: 90_000_000,
        location: { address: "Guzape II, Abuja", landmarks: [] },
        bestFitBuyerTypes: ["investment"],
        paymentPlanTypes: ["oneTime"],
      }),
    ]);
    expect(results).toHaveLength(0);
  });

  it("sorts multiple matches best-first", () => {
    const results = matchProperties(baseProfile(), [
      property({ id: "partial-match", bestFitBuyerTypes: ["investment"] }),
      property({ id: "full-match" }),
    ]);
    expect(results.map((r) => r.propertyId)).toEqual(["full-match", "partial-match"]);
  });
});
