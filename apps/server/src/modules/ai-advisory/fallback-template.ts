import type { AIPromptKey } from "@forth-urban/shared-types";

/**
 * Local, non-LLM safety-net text — docs/IMPLEMENTATION_PLAN.md Phase 5 exit
 * criteria: "loading/error states with graceful fallback to a plain-language
 * template if both providers fail (never block the user from seeing their
 * numbers)". Used only when both OpenAI and Gemini fail; deliberately plain
 * and generic since it must work from whatever fields happen to be present
 * in `context` without ever inventing a fact.
 */
export function buildFallbackText(promptKey: AIPromptKey, context: Record<string, unknown>): string {
  const nextAction = (context.nextAction as { action?: string } | undefined)?.action;
  const actionSentence = nextAction ? ` Next recommended step: ${nextAction}.` : "";

  switch (promptKey) {
    case "quiz-summary":
      return `Your Home-Readiness result is ready (${context.resultType ?? "see your dashboard"}).${actionSentence}`;
    case "buyer-persona":
      return `Based on your answers, you're a ${context.buyerPersona ?? "unique buyer"}.${actionSentence}`;
    case "recommendation":
      return `${context.propertyName ?? "This property"} at ${context.estateName ?? "the estate"} was matched to your quiz answers.${actionSentence}`;
    case "roi-explainer":
      return `Over ${context.years ?? "the selected"} years, the ${context.scenario ?? "selected"} scenario projects a future value of ${context.futureValue ?? "the amount shown"}. This projection is for educational purposes only. Real estate value can be affected by infrastructure, demand, documentation, government policy, access roads, and market conditions.${actionSentence}`;
    case "inspection-advice":
      return `Here is your inspection checklist for ${context.propertyName ?? "this property"}. Bring your questions and ask for a written payment breakdown.${actionSentence}`;
    case "ask":
      return `We couldn't generate a personalized answer right now, but your numbers above are accurate.${actionSentence}`;
    default:
      return `Your result is ready.${actionSentence}`;
  }
}
