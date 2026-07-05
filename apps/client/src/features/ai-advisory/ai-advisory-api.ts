import { useQuery } from "@tanstack/react-query";
import type { AIAdvisoryResponseDTO, RoiScenarioKey } from "@forth-urban/shared-types";
import { apiClient } from "../../lib/api-client";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
}

/**
 * LLM Advisory Layer — Phase 5 (docs/ARCHITECTURE.md#llm-advisory-layer-appsserversrcmodulesai-advisory).
 *
 * Every hook here is a `useQuery` (not `useMutation`) even though the server
 * routes are POST: from the client's perspective these are read-only,
 * automatic "fetch an explanation for this result" calls, so treating them
 * as cacheable queries (keyed by their inputs) avoids redundant regeneration
 * when a page re-renders. `staleTime: Infinity` — a given result's
 * explanation never needs to be refetched within the session.
 */
async function postAdvisory(path: string, body: Record<string, unknown> = {}): Promise<AIAdvisoryResponseDTO> {
  const res = await apiClient.post<ApiEnvelope<AIAdvisoryResponseDTO>>(path, body);
  return res.data.data!;
}

/** Explains the Home-Readiness Quiz result (PRODUCT_SPEC §5). Requires a completed quiz. */
export function useQuizSummaryExplanation(enabled: boolean) {
  return useQuery({
    queryKey: ["ai", "quiz-summary"],
    queryFn: () => postAdvisory("/ai/quiz-summary"),
    enabled,
    retry: false,
    staleTime: Infinity,
  });
}

/** Explains why a specific matched property fits the user (PRODUCT_SPEC §7). */
export function useRecommendationExplanation(propertyId: string | undefined) {
  return useQuery({
    queryKey: ["ai", "recommendation", propertyId],
    queryFn: () => postAdvisory("/ai/recommendation-explainer", { propertyId }),
    enabled: Boolean(propertyId),
    retry: false,
    staleTime: Infinity,
  });
}

export interface RoiExplanationInput {
  propertyId: string;
  years: number;
  scenario: RoiScenarioKey;
}

/** Explains a Decision-Engine-calculated ROI projection (PRODUCT_SPEC §10). */
export function useRoiExplanation(input: RoiExplanationInput | null) {
  return useQuery({
    queryKey: ["ai", "roi-explainer", input],
    queryFn: () => postAdvisory("/ai/roi-explainer", { ...input }),
    enabled: Boolean(input),
    retry: false,
    staleTime: Infinity,
  });
}
