import type { AIProvider } from "@forth-urban/shared-types";
import { renderPrompt } from "../prompt-loader.js";

const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiGenerateContentResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

/**
 * Gemini provider (fallback) — docs/ARCHITECTURE.md#llm-advisory-layer-appsserversrcmodulesai-advisory.
 *
 * Uses a plain `fetch` call to the Generative Language REST API rather than
 * a Google SDK, matching the zero-extra-dependency approach of
 * `OpenAIProvider`. Only ever invoked by `AIAdvisoryService` when the
 * primary (OpenAI) provider fails.
 */
export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  constructor(
    private readonly apiKey: string | undefined,
    private readonly model: string,
  ) {}

  async generate(input: Parameters<AIProvider["generate"]>[0]): ReturnType<AIProvider["generate"]> {
    if (!this.apiKey) {
      throw new Error("Gemini provider is not configured (missing GEMINI_API_KEY)");
    }

    const { systemPrompt, version } = renderPrompt(input.promptKey, input.context);

    const response = await fetch(`${GEMINI_API_BASE_URL}/${this.model}:generateContent?key=${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
        generationConfig: { maxOutputTokens: input.maxTokens ?? 300 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini request failed with status ${response.status}: ${await response.text()}`);
    }

    const json = (await response.json()) as GeminiGenerateContentResponse;
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      throw new Error("Gemini response contained no text");
    }

    return { text, provider: this.name, promptVersion: String(version) };
  }
}
