import type { AIPromptKey, AIProvider } from "@forth-urban/shared-types";
import { logger } from "../../config/logger.js";
import { env } from "../../config/env.js";
import { Sentry } from "../../config/sentry.js";
import { OpenAIProvider } from "./providers/openai.provider.js";
import { GeminiProvider } from "./providers/gemini.provider.js";
import { buildFallbackText } from "./fallback-template.js";

export interface AIAdvisoryGenerateInput {
  promptKey: AIPromptKey;
  context: Record<string, unknown>;
  maxTokens?: number;
}

export interface AIAdvisoryGenerateResult {
  text: string;
  provider: string;
  promptVersion: string;
  degraded: boolean;
}

/**
 * AIAdvisoryService — docs/ARCHITECTURE.md#llm-advisory-layer-appsserversrcmodulesai-advisory.
 *
 * Tries the primary provider, falls back to the secondary on failure, and
 * (Phase 5 exit criteria) falls back further to a local plain-language
 * template if *both* fail, so a provider outage never blocks a user from
 * seeing their (already-computed) numbers. Every failure is logged via Pino
 * and reported to Sentry (Phase 8) with the promptKey/provider as tags so
 * provider outages and prompt bugs are visible without digging through logs.
 */
export class AIAdvisoryService {
  constructor(
    private readonly primary: AIProvider,
    private readonly fallback: AIProvider,
  ) {}

  async generate(input: AIAdvisoryGenerateInput): Promise<AIAdvisoryGenerateResult> {
    try {
      const result = await this.primary.generate(input);
      return { ...result, degraded: false };
    } catch (primaryErr) {
      logger.warn({ err: primaryErr, promptKey: input.promptKey }, "primary AI provider failed, using fallback");
      Sentry.captureException(primaryErr, { tags: { promptKey: input.promptKey, provider: "primary" } });
      try {
        const result = await this.fallback.generate(input);
        return { ...result, degraded: false };
      } catch (fallbackErr) {
        logger.error(
          { err: fallbackErr, promptKey: input.promptKey },
          "fallback AI provider also failed, using local plain-language template",
        );
        Sentry.captureException(fallbackErr, { tags: { promptKey: input.promptKey, provider: "fallback" } });
        return {
          text: buildFallbackText(input.promptKey, input.context),
          provider: "template",
          promptVersion: "n/a",
          degraded: true,
        };
      }
    }
  }
}

let singleton: AIAdvisoryService | null = null;

/** Lazily builds the singleton service from current env config (providers read their key/model at construction). */
export function getAiAdvisoryService(): AIAdvisoryService {
  if (!singleton) {
    singleton = new AIAdvisoryService(
      new OpenAIProvider(env.OPENAI_API_KEY, env.OPENAI_MODEL),
      new GeminiProvider(env.GEMINI_API_KEY, env.GEMINI_MODEL),
    );
  }
  return singleton;
}
