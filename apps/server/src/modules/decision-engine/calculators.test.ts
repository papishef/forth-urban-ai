import { describe, expect, it } from "vitest";
import {
  AFFORDABILITY_BAND_LABELS,
  aggregateHiddenCosts,
  calculateBudget,
  calculateRoi,
  getAffordabilityAdvice,
  type HiddenCostRuleInput,
} from "./calculators.js";

describe("calculateBudget", () => {
  it("bands a 0-25% ratio as comfortable", () => {
    // balance = 15,000,000; installment = 15,000,000 / 24 = 625,000; ratio = 625,000 / 5,000,000 = 12.5%
    const result = calculateBudget({
      propertyPrice: 20_000_000,
      downPayment: 5_000_000,
      installmentDurationMonths: 24,
      monthlyIncome: 5_000_000,
      includeHiddenCosts: false,
      hiddenCostTotal: 0,
    });

    expect(result.balance).toBe(15_000_000);
    expect(result.monthlyInstallment).toBe(625_000);
    expect(result.affordabilityRatio).toBeCloseTo(0.125);
    expect(result.affordabilityBand).toBe("comfortable");
  });

  it("bands a 26-40% ratio as manageable", () => {
    // balance = 12,000,000; installment = 12,000,000 / 12 = 1,000,000; ratio = 1,000,000 / 3,000,000 = 33.3%
    const result = calculateBudget({
      propertyPrice: 15_000_000,
      downPayment: 3_000_000,
      installmentDurationMonths: 12,
      monthlyIncome: 3_000_000,
      includeHiddenCosts: false,
      hiddenCostTotal: 0,
    });

    expect(result.affordabilityRatio).toBeCloseTo(0.3333, 3);
    expect(result.affordabilityBand).toBe("manageable");
  });

  it("bands a 41-60% ratio as tight", () => {
    // balance = 10,000,000; installment = 10,000,000 / 10 = 1,000,000; ratio = 1,000,000 / 2,000,000 = 50%
    const result = calculateBudget({
      propertyPrice: 12_000_000,
      downPayment: 2_000_000,
      installmentDurationMonths: 10,
      monthlyIncome: 2_000_000,
      includeHiddenCosts: false,
      hiddenCostTotal: 0,
    });

    expect(result.affordabilityRatio).toBeCloseTo(0.5);
    expect(result.affordabilityBand).toBe("tight");
  });

  it("bands a >60% ratio as risky", () => {
    // balance = 18,000,000; installment = 18,000,000 / 12 = 1,500,000; ratio = 1,500,000 / 1,000,000 = 150%
    const result = calculateBudget({
      propertyPrice: 20_000_000,
      downPayment: 2_000_000,
      installmentDurationMonths: 12,
      monthlyIncome: 1_000_000,
      includeHiddenCosts: false,
      hiddenCostTotal: 0,
    });

    expect(result.affordabilityRatio).toBeCloseTo(1.5);
    expect(result.affordabilityBand).toBe("risky");
  });

  it("treats zero monthly income as an unconfirmed (risky) affordability ratio", () => {
    const result = calculateBudget({
      propertyPrice: 10_000_000,
      downPayment: 1_000_000,
      installmentDurationMonths: 12,
      monthlyIncome: 0,
      includeHiddenCosts: false,
      hiddenCostTotal: 0,
    });

    expect(result.affordabilityRatio).toBeNull();
    expect(result.affordabilityBand).toBe("risky");
  });

  it("folds the hidden cost total into the financed balance when includeHiddenCosts is true", () => {
    const withoutHiddenCosts = calculateBudget({
      propertyPrice: 10_000_000,
      downPayment: 2_000_000,
      installmentDurationMonths: 8,
      monthlyIncome: 2_000_000,
      includeHiddenCosts: false,
      hiddenCostTotal: 800_000,
    });
    const withHiddenCosts = calculateBudget({
      propertyPrice: 10_000_000,
      downPayment: 2_000_000,
      installmentDurationMonths: 8,
      monthlyIncome: 2_000_000,
      includeHiddenCosts: true,
      hiddenCostTotal: 800_000,
    });

    expect(withoutHiddenCosts.balance).toBe(8_000_000);
    expect(withHiddenCosts.balance).toBe(8_800_000);
    expect(withHiddenCosts.monthlyInstallment).toBeGreaterThan(withoutHiddenCosts.monthlyInstallment);
  });

  it("exposes labels and advice text for every band", () => {
    expect(AFFORDABILITY_BAND_LABELS.comfortable).toBe("Comfortable");
    expect(getAffordabilityAdvice("comfortable")).toBe("Proceed to hidden cost breakdown");
    expect(getAffordabilityAdvice("manageable")).toBe("Proceed, review monthly pressure");
    expect(getAffordabilityAdvice("tight")).toBe(
      "Consider a longer plan, bigger down payment, or a lower-cost property",
    );
    expect(getAffordabilityAdvice("risky")).toBe("Recommend a more affordable property or a savings plan");
  });
});

describe("aggregateHiddenCosts", () => {
  const rules: HiddenCostRuleInput[] = [
    { key: "surveyFee", label: "Survey Fee", amount: 150_000, applicable: true },
    { key: "legalFee", label: "Legal/Documentation Fee", amount: 250_000, applicable: true },
    { key: "allocationFee", label: "Allocation Fee", amount: 100_000, applicable: false },
  ];

  it("sums only applicable rules and returns the filtered item list", () => {
    const result = aggregateHiddenCosts(rules);

    expect(result.total).toBe(400_000);
    expect(result.items).toHaveLength(2);
    expect(result.items.map((item) => item.key)).toEqual(["surveyFee", "legalFee"]);
  });

  it("returns a zero total for an empty rule set", () => {
    expect(aggregateHiddenCosts([])).toEqual({ items: [], total: 0 });
  });
});

describe("calculateRoi", () => {
  it("computes futureValue/estimatedGain/roiPercent for all three scenarios", () => {
    const result = calculateRoi(10_000_000, 5, { conservative: 0.05, moderate: 0.1, optimistic: 0.15 });

    // futureValue = 10,000,000 * 1.05^5 = 12,762,815.625
    expect(result.conservative.rate).toBe(0.05);
    expect(result.conservative.futureValue).toBeCloseTo(12_762_815.625, 2);
    expect(result.conservative.estimatedGain).toBeCloseTo(2_762_815.625, 2);
    expect(result.conservative.roiPercent).toBeCloseTo(27.62815625, 4);

    // futureValue = 10,000,000 * 1.10^5 = 16,105,100
    expect(result.moderate.futureValue).toBeCloseTo(16_105_100, 2);
    expect(result.moderate.roiPercent).toBeCloseTo(61.051, 3);

    // futureValue = 10,000,000 * 1.15^5 = 20,113,571.875
    expect(result.optimistic.futureValue).toBeCloseTo(20_113_571.875, 2);
    expect(result.optimistic.roiPercent).toBeCloseTo(101.13571875, 4);
  });

  it("returns a zero roiPercent when currentPrice is 0 (avoids division by zero)", () => {
    const result = calculateRoi(0, 5, { conservative: 0.05, moderate: 0.1, optimistic: 0.15 });
    expect(result.conservative.roiPercent).toBe(0);
    expect(result.moderate.roiPercent).toBe(0);
    expect(result.optimistic.roiPercent).toBe(0);
  });
});
