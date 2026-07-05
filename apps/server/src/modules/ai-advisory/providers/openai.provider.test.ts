import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAIProvider } from "./openai.provider.js";

describe("OpenAIProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const context = {
    buyerPersona: "Budget Starter",
    readinessScore: 72,
    buyerGoal: "firstTime",
    timeline: "now",
    paymentStyle: "installment",
  };

  it("throws when no API key is configured, without making a network call", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const provider = new OpenAIProvider(undefined, "gpt-5.1");
    await expect(provider.generate({ promptKey: "buyer-persona", context })).rejects.toThrow(/OPENAI_API_KEY/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("calls the Chat Completions API and returns the parsed text on success", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "  Warm explanation.  " } }] }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const provider = new OpenAIProvider("fake-key", "gpt-5.1");
    const result = await provider.generate({ promptKey: "buyer-persona", context });

    expect(result).toEqual({ text: "Warm explanation.", provider: "openai", promptVersion: "1" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const call = fetchSpy.mock.calls[0]!;
    const [url, requestInit] = call;
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(requestInit.headers.Authorization).toBe("Bearer fake-key");
    const body = JSON.parse(requestInit.body);
    expect(body.model).toBe("gpt-5.1");
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[0].content).toContain("Budget Starter");
  });

  it("throws when the API responds with a non-ok status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429, text: async () => "rate limited" }),
    );

    const provider = new OpenAIProvider("fake-key", "gpt-5.1");
    await expect(provider.generate({ promptKey: "buyer-persona", context })).rejects.toThrow(/status 429/);
  });

  it("throws when the API response contains no text", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [] }) }));

    const provider = new OpenAIProvider("fake-key", "gpt-5.1");
    await expect(provider.generate({ promptKey: "buyer-persona", context })).rejects.toThrow(/no text/);
  });
});
