import type { AIProvider } from "@forth-urban/shared-types";
import { renderPrompt } from "../prompt-loader.js";

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

interface OpenAIChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

/**
 * OpenAI provider (primary) — docs/ARCHITECTURE.md#llm-advisory-layer-appsserversrcmodulesai-advisory.
 *
 * Uses a plain `fetch` call to the Chat Completions REST API rather than the
 * `openai` SDK, so this module has zero extra runtime dependencies. The
 * rendered prompt (context already embedded, injection-hygiene already
 * applied by the prompt loader) is sent as a single system message.
 */
export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  constructor(
    private readonly apiKey: string | undefined,
    private readonly model: string,
  ) {}

  async generate(input: Parameters<AIProvider["generate"]>[0]): ReturnType<AIProvider["generate"]> {
    if (!this.apiKey) {
      throw new Error("OpenAI provider is not configured (missing OPENAI_API_KEY)");
    }

    const { systemPrompt, version } = renderPrompt(input.promptKey, input.context);

    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "system", content: systemPrompt }],
        // `max_tokens` is deprecated and rejected outright by newer models
        // (e.g. gpt-5.1) with a 400. `max_completion_tokens` is its
        // replacement and is accepted across all current chat-completions
        // models, so we always send that instead.
        max_completion_tokens: input.maxTokens ?? 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with status ${response.status}: ${await response.text()}`);
    }

    const json = (await response.json()) as OpenAIChatCompletionResponse;
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error("OpenAI response contained no text");
    }

    return { text, provider: this.name, promptVersion: String(version) };
  }
}
