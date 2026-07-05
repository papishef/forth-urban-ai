import { describe, expect, it } from "vitest";
import { loadPrompt, renderPrompt } from "./prompt-loader.js";

describe("prompt-loader", () => {
  const allPromptKeys = ["quiz-summary", "recommendation", "buyer-persona", "inspection-advice", "roi-explainer", "ask"];

  it.each(allPromptKeys)("loads and parses front-matter for the %s prompt", (promptKey) => {
    const template = loadPrompt(promptKey);
    expect(template.key).toBe(promptKey);
    expect(template.version).toBeGreaterThanOrEqual(1);
    expect(template.modelHint.length).toBeGreaterThan(0);
    expect(template.inputs.length).toBeGreaterThan(0);
    expect(template.body).toContain("{{context}}");
  });

  it("throws a 500 ApiError for an unknown prompt key", () => {
    expect(() => loadPrompt("does-not-exist")).toThrow(/was not found/);
  });

  it("renders a prompt by substituting {{context}} with the JSON context", () => {
    const { systemPrompt, version, modelHint } = renderPrompt("buyer-persona", {
      buyerPersona: "Budget Starter",
      readinessScore: 72,
      buyerGoal: "firstTime",
      timeline: "now",
      paymentStyle: "installment",
    });

    expect(systemPrompt).toContain("\"buyerPersona\": \"Budget Starter\"");
    expect(systemPrompt).not.toContain("{{context}}");
    expect(version).toBe(1);
    expect(modelHint).toBe("gpt-5.1");
  });

  it("fails fast when required context fields are missing, before calling any provider", () => {
    expect(() => renderPrompt("buyer-persona", { buyerPersona: "Budget Starter" })).toThrow(
      /Missing required context fields/,
    );
  });

  it("caches the parsed template across calls", () => {
    const first = loadPrompt("roi-explainer");
    const second = loadPrompt("roi-explainer");
    expect(first).toBe(second);
  });
});
