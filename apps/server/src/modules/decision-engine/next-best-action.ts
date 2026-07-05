import type { BuyerGoal } from "@forth-urban/validation";
import type { NextActionTrigger } from "@forth-urban/shared-types";

/**
 * Next Best Action engine — docs/PRODUCT_SPEC.md#6-next-best-action-engine-deterministic-rules
 *
 * A pure lookup table implementing every trigger from the spec table. Every
 * path in the funnel terminates at inspection, the sole conversion event.
 */
const NEXT_BEST_ACTION_TABLE: Record<NextActionTrigger, { action: string; reason: string }> = {
  homeReadinessQuizCompleted: {
    action: "View matched available lands",
    reason: "Needs options fitting result",
  },
  propertyCardViewed: {
    action: "Calculate payment breakdown",
    reason: "Price clarity qualifies intent",
  },
  budgetCalculatorUsed: {
    action: "View hidden costs",
    reason: "Builds trust",
  },
  hiddenCostGuideViewed: {
    action: "Run ROI projection or inspect property",
    reason: "Understands total cost",
  },
  roiCalculatorRun: {
    action: "Book inspection",
    reason: "Investment interest converts to verification",
  },
  areaQuizCompleted: {
    action: "View available land in recommended area",
    reason: "Converts clarity to shortlist",
  },
  inspectionChecklistDownloaded: {
    action: "Schedule inspection",
    reason: "Prepares for site visit",
  },
  quizAbandoned: {
    action: "Email reminder to continue",
    reason: "Recover abandoned lead",
  },
  propertyViewedTwice: {
    action: "Invite virtual/physical inspection",
    reason: "Repeat viewing signals high intent",
  },
  inspectionBooked: {
    action: "Attend your inspection and watch for your advisor's follow-up",
    reason: "Booking confirmed — the final step before ownership",
  },
};

/** Looks up the deterministic next-best-action recommendation for a trigger. */
export function selectNextBestAction(trigger: NextActionTrigger): {
  trigger: NextActionTrigger;
  action: string;
  reason: string;
} {
  return { trigger, ...NEXT_BEST_ACTION_TABLE[trigger] };
}

/**
 * Buyer-goal-aware refinement of the `hiddenCostGuideViewed` next action
 * (PRODUCT_SPEC §9: "first-time buyers -> inspection checklist first;
 * investors -> ROI projection first"). Falls back to the generic combined
 * action from the Next Best Action table for every other buyer goal, or when
 * the user has no profile yet.
 */
export function selectHiddenCostNextAction(buyerGoal: BuyerGoal | null): {
  trigger: NextActionTrigger;
  action: string;
  reason: string;
} {
  const base = selectNextBestAction("hiddenCostGuideViewed");

  if (buyerGoal === "firstTime") {
    return { ...base, action: "View inspection checklist" };
  }
  if (buyerGoal === "investment") {
    return { ...base, action: "Run ROI projection" };
  }
  return base;
}
