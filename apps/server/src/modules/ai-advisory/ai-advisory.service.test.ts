import { describe, expect, it, vi } from "vitest";
import type { AIProvider } from "@forth-urban/shared-types";
import { AIAdvisoryService } from "./ai-advisory.service.js";

function fakeProvider(name: string, behavior: "succeed" | "fail"): AIProvider {
  return {
    generate: vi.fn(async () => {
      if (behavior === "fail") throw new Error(`${name} failed`);
      return { text: `text from ${name}`, provider: name, promptVersion: "1" };
    }),
  };
}

describe("AIAdvisoryService", () => {
  const input = { promptKey: "buyer-persona" as const, context: { buyerPersona: "Budget Starter" } };

  it("uses the primary provider when it succeeds", async () => {
    const primary = fakeProvider("openai", "succeed");
    const fallback = fakeProvider("gemini", "succeed");
    const service = new AIAdvisoryService(primary, fallback);

    const result = await service.generate(input);

    expect(result).toEqual({ text: "text from openai", provider: "openai", promptVersion: "1", degraded: false });
    expect(fallback.generate).not.toHaveBeenCalled();
  });

  it("falls back to the secondary provider when the primary fails", async () => {
    const primary = fakeProvider("openai", "fail");
    const fallback = fakeProvider("gemini", "succeed");
    const service = new AIAdvisoryService(primary, fallback);

    const result = await service.generate(input);

    expect(result).toEqual({ text: "text from gemini", provider: "gemini", promptVersion: "1", degraded: false });
  });

  it("falls back to a local plain-language template when both providers fail", async () => {
    const primary = fakeProvider("openai", "fail");
    const fallback = fakeProvider("gemini", "fail");
    const service = new AIAdvisoryService(primary, fallback);

    const result = await service.generate({
      promptKey: "buyer-persona",
      context: { buyerPersona: "Budget Starter", nextAction: { action: "View matched properties" } },
    });

    expect(result.provider).toBe("template");
    expect(result.degraded).toBe(true);
    expect(result.text).toContain("Budget Starter");
    expect(result.text).toContain("View matched properties");
  });
});
