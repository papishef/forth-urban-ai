import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPendingHomeReadinessQuiz,
  getPendingHomeReadinessQuiz,
  getPendingHomeReadinessProgress,
  hasPendingHomeReadinessAuthHandoff,
  markPendingHomeReadinessAuthHandoff,
  savePendingHomeReadinessProgress,
  savePendingHomeReadinessQuiz,
} from "./pending-home-readiness";
import type { HomeReadinessAnswers } from "@forth-urban/validation";

const answers: HomeReadinessAnswers = {
  buyerGoal: "investment",
  budgetRange: { min: 1_000_000, max: 5_000_000 },
  monthlyIncome: 300_000,
  paymentStyle: "oneTime",
  timeline: "now",
  preferredArea: "Kuje",
  lifestylePreference: "familyFriendly",
  biggestFear: "affordability",
  inspectionPreference: "physical",
};

describe("pending home-readiness draft", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-22T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("round-trips validated answers and clears the auth marker with the draft", () => {
    expect(savePendingHomeReadinessQuiz(answers)).toBe(true);
    expect(getPendingHomeReadinessQuiz()).toEqual(answers);

    markPendingHomeReadinessAuthHandoff();
    expect(hasPendingHomeReadinessAuthHandoff()).toBe(true);

    clearPendingHomeReadinessQuiz();
    expect(getPendingHomeReadinessQuiz()).toBeNull();
    expect(hasPendingHomeReadinessAuthHandoff()).toBe(false);
  });

  it("rejects malformed and expired drafts instead of submitting them", () => {
    sessionStorage.setItem(
      "forth-urban.pending-home-readiness",
      JSON.stringify({ version: 1, savedAt: Date.now() - 25 * 60 * 60 * 1000, answers }),
    );
    expect(getPendingHomeReadinessQuiz()).toBeNull();

    sessionStorage.setItem(
      "forth-urban.pending-home-readiness",
      JSON.stringify({ version: 1, savedAt: Date.now(), answers: { buyerGoal: "not-valid" } }),
    );
    expect(getPendingHomeReadinessQuiz()).toBeNull();
  });

  it("stores a valid in-progress step and removes it when the quiz is completed", () => {
    expect(savePendingHomeReadinessProgress({ buyerGoal: "investment" }, 1)).toBe(true);
    expect(getPendingHomeReadinessProgress()).toEqual({
      stepIndex: 1,
      answers: { buyerGoal: "investment" },
    });

    expect(savePendingHomeReadinessQuiz(answers)).toBe(true);
    expect(getPendingHomeReadinessProgress()).toBeNull();
  });
});