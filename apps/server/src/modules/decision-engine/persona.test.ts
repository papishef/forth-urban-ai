import { describe, expect, it } from "vitest";
import type { HomeReadinessAnswers } from "@forth-urban/validation";
import { selectBuyerPersona, selectLeadCategory } from "./persona.js";
import { getReadinessBand, scoreHomeReadiness } from "./readiness.js";

function baseAnswers(overrides: Partial<HomeReadinessAnswers>): HomeReadinessAnswers {
  return {
    buyerGoal: "residential",
    budgetRange: { min: 10_000_000, max: 20_000_000 },
    monthlyIncome: 1_000_000,
    paymentStyle: "installment",
    timeline: "now",
    preferredArea: "Lugbe",
    lifestylePreference: "familyFriendly",
    biggestFear: "documentation",
    inspectionPreference: "physical",
    ...overrides,
  };
}

describe("selectBuyerPersona", () => {
  it("picks Diaspora Investor for a diaspora buyer goal, regardless of budget", () => {
    expect(selectBuyerPersona(baseAnswers({ buyerGoal: "diaspora", budgetRange: { min: 1, max: 1 } }))).toBe(
      "Diaspora Investor",
    );
  });

  it("picks Growth Investor for an investment buyer goal", () => {
    expect(selectBuyerPersona(baseAnswers({ buyerGoal: "investment" }))).toBe("Growth Investor");
  });

  it("picks Budget Starter for a first-time buyer with a low budget", () => {
    expect(
      selectBuyerPersona(baseAnswers({ buyerGoal: "firstTime", budgetRange: { min: 5_000_000, max: 10_000_000 } })),
    ).toBe("Budget Starter");
  });

  it("picks First-Time Ownership Builder for a first-time buyer with a mid budget", () => {
    expect(
      selectBuyerPersona(baseAnswers({ buyerGoal: "firstTime", budgetRange: { min: 20_000_000, max: 25_000_000 } })),
    ).toBe("First-Time Ownership Builder");
  });

  it("picks Premium Home Builder for a residential/family buyer with a high budget", () => {
    expect(
      selectBuyerPersona(baseAnswers({ buyerGoal: "family", budgetRange: { min: 40_000_000, max: 50_000_000 } })),
    ).toBe("Premium Home Builder");
  });

  it("picks First-Time Ownership Builder for a residential/family buyer with a mid budget", () => {
    expect(
      selectBuyerPersona(baseAnswers({ buyerGoal: "residential", budgetRange: { min: 20_000_000, max: 25_000_000 } })),
    ).toBe("First-Time Ownership Builder");
  });
});

describe("selectLeadCategory", () => {
  it("prioritizes diaspora over band/persona", () => {
    const answers = baseAnswers({ buyerGoal: "diaspora", timeline: "justExploring" });
    const score = scoreHomeReadiness(answers);
    const band = getReadinessBand(score);
    const persona = selectBuyerPersona(answers);
    expect(selectLeadCategory(answers, band, persona)).toBe("diaspora");
  });

  it("prioritizes investor over band", () => {
    const answers = baseAnswers({ buyerGoal: "investment", timeline: "justExploring" });
    const band = getReadinessBand(scoreHomeReadiness(answers));
    const persona = selectBuyerPersona(answers);
    expect(selectLeadCategory(answers, band, persona)).toBe("investor");
  });

  it("categorizes a Budget Starter persona as budgetStarter", () => {
    const answers = baseAnswers({
      buyerGoal: "firstTime",
      budgetRange: { min: 5_000_000, max: 10_000_000 },
    });
    const band = getReadinessBand(scoreHomeReadiness(answers));
    const persona = selectBuyerPersona(answers);
    expect(persona).toBe("Budget Starter");
    expect(selectLeadCategory(answers, band, persona)).toBe("budgetStarter");
  });

  it("categorizes a readyBuyer band as hot", () => {
    const answers = baseAnswers({});
    expect(selectLeadCategory(answers, "readyBuyer", "First-Time Ownership Builder")).toBe("hot");
  });

  it("categorizes an almostReady band as warm", () => {
    const answers = baseAnswers({});
    expect(selectLeadCategory(answers, "almostReady", "First-Time Ownership Builder")).toBe("warm");
  });

  it("falls back to research for other bands", () => {
    const answers = baseAnswers({});
    expect(selectLeadCategory(answers, "researchingBuyer", "First-Time Ownership Builder")).toBe("research");
    expect(selectLeadCategory(answers, "earlyStageBuyer", "First-Time Ownership Builder")).toBe("research");
  });
});
