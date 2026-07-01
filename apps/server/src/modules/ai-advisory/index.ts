/**
 * LLM Advisory Layer — Phase 5 (see docs/ARCHITECTURE.md#llm-advisory-layer-appsserversrcmodulesai-advisory).
 *
 * STRICT RULE: this module explains numbers the Decision Engine already
 * computed. It never performs financial arithmetic or scoring itself.
 *
 * Will own: AIProvider interface, OpenAI (primary) + Anthropic (fallback)
 * adapters, prompt loader (reads prompts/*.md), /api/ai/* endpoints.
 */
export {};
