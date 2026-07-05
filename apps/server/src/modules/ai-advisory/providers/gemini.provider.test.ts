import { afterEach, describe, expect, it, vi } from "vitest";
import { GeminiProvider } from "./gemini.provider.js";

describe("GeminiProvider", () => {
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

    const provider = new GeminiProvider(undefined, "gemini-2.5-flash");
    await expect(provider.generate({ promptKey: "buyer-persona", context })).rejects.toThrow(/GEMINI_API_KEY/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("calls the Generative Language API and returns the parsed text on success", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: "  Warm explanation.  " }] } }] }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const provider = new GeminiProvider("fake-key", "gemini-2.5-flash");
    const result = await provider.generate({ promptKey: "buyer-persona", context });

    expect(result).toEqual({ text: "Warm explanation.", provider: "gemini", promptVersion: "1" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const call = fetchSpy.mock.calls[0]!;
    const [url, requestInit] = call;
    expect(url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=fake-key",
    );
    const body = JSON.parse(requestInit.body);
    expect(body.contents[0].parts[0].text).toContain("Budget Starter");
  });

  it("throws when the API responds with a non-ok status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => "server error" }),
    );

    const provider = new GeminiProvider("fake-key", "gemini-2.5-flash");
    await expect(provider.generate({ promptKey: "buyer-persona", context })).rejects.toThrow(/status 500/);
  });

  it("throws when the API response contains no text", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ candidates: [] }) }));

    const provider = new GeminiProvider("fake-key", "gemini-2.5-flash");
    await expect(provider.generate({ promptKey: "buyer-persona", context })).rejects.toThrow(/no text/);
  });
});
