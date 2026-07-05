import type {
  AiAskInput,
  AiInspectionAdviceInput,
  AiRecommendationExplainerInput,
  AiRoiExplainerInput,
} from "@forth-urban/validation";
import type { AIAdvisoryResponseDTO, AIPromptKey } from "@forth-urban/shared-types";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import { getAiAdvisoryService } from "./ai-advisory.service.js";
import { AiResponse } from "./ai-response.model.js";
import {
  buildAskContext,
  buildBuyerPersonaContext,
  buildInspectionAdviceContext,
  buildQuizSummaryContext,
  buildRecommendationContext,
  buildRoiExplainerContext,
} from "./ai-advisory.context.js";

/**
 * Orchestrates one LLM Advisory Layer call end-to-end: build context from
 * the user's own Decision Engine output, ask `AIAdvisoryService` for an
 * explanation (with provider fallback baked in), persist an `AiResponse`
 * record for traceability, and audit-log the event. Every exported function
 * below is a thin, endpoint-specific wrapper around this.
 */
async function runAdvisory(
  userId: string,
  promptKey: AIPromptKey,
  context: Record<string, unknown>,
): Promise<AIAdvisoryResponseDTO> {
  const result = await getAiAdvisoryService().generate({ promptKey, context });

  await AiResponse.create({
    userId,
    promptKey,
    promptVersion: result.promptVersion,
    provider: result.provider,
    degraded: result.degraded,
    context,
    text: result.text,
  });

  await recordAuditLog({
    actorId: userId,
    actorType: "user",
    action: "ai.advisory_generated",
    targetType: "AiResponse",
    metadata: { promptKey, provider: result.provider, degraded: result.degraded },
  });

  return { promptKey, text: result.text, provider: result.provider, promptVersion: result.promptVersion, degraded: result.degraded };
}

export async function generateQuizSummary(userId: string): Promise<AIAdvisoryResponseDTO> {
  const context = await buildQuizSummaryContext(userId);
  return runAdvisory(userId, "quiz-summary", context);
}

export async function generateBuyerPersona(userId: string): Promise<AIAdvisoryResponseDTO> {
  const context = await buildBuyerPersonaContext(userId);
  return runAdvisory(userId, "buyer-persona", context);
}

export async function generateRecommendationExplainer(
  userId: string,
  input: AiRecommendationExplainerInput,
): Promise<AIAdvisoryResponseDTO> {
  const context = await buildRecommendationContext(userId, input.propertyId);
  return runAdvisory(userId, "recommendation", context);
}

export async function generateRoiExplainer(userId: string, input: AiRoiExplainerInput): Promise<AIAdvisoryResponseDTO> {
  const context = await buildRoiExplainerContext(input.propertyId, input.years, input.scenario);
  return runAdvisory(userId, "roi-explainer", context);
}

export async function generateInspectionAdvice(
  userId: string,
  input: AiInspectionAdviceInput,
): Promise<AIAdvisoryResponseDTO> {
  const context = await buildInspectionAdviceContext(userId, input.propertyId, input.inspectionType);
  return runAdvisory(userId, "inspection-advice", context);
}

export async function askAdvisor(userId: string, input: AiAskInput): Promise<AIAdvisoryResponseDTO> {
  const context = await buildAskContext(userId, input.question);
  return runAdvisory(userId, "ask", context);
}
