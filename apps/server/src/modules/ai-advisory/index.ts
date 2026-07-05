/**
 * LLM Advisory Layer — Phase 5 (see docs/ARCHITECTURE.md#llm-advisory-layer-appsserversrcmodulesai-advisory).
 *
 * STRICT RULE: this module explains numbers the Decision Engine already
 * computed. It never performs financial arithmetic or scoring itself.
 *
 * Owns: AIProvider interface (packages/shared-types), OpenAI (primary) +
 * Gemini (fallback) adapters, prompt loader (reads prompts/*.md),
 * `/api/ai/*` endpoints.
 */
export { aiAdvisoryRouter } from "./ai-advisory.routes.js";
export { PROMPT_KEYS, getRawPrompt, savePrompt, renderPrompt } from "./prompt-loader.js";
export { getAiAdvisoryService } from "./ai-advisory.service.js";
