import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalFetch = global.fetch;
const originalEnv = { ...process.env };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function importFreshClient() {
  vi.resetModules();
  return import("@/lib/investmentAnalysis/aiClient");
}

const samplePrompt = { system: "system prompt", user: "user prompt" };

describe("AI investment analyst client", () => {
  beforeEach(() => {
    process.env.AI_PROVIDER = "anthropic";
    process.env.AI_API_KEY = "test-ai-key-456";
    process.env.AI_MODEL = "claude-sonnet-5";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("throws not_configured when no provider is set, without making a request", async () => {
    delete process.env.AI_PROVIDER;
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const { callAiInvestmentAnalyst } = await importFreshClient();
    await expect(callAiInvestmentAnalyst(samplePrompt)).rejects.toMatchObject({ code: "not_configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("throws not_configured when no API key is set, without making a request", async () => {
    delete process.env.AI_API_KEY;
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const { callAiInvestmentAnalyst } = await importFreshClient();
    await expect(callAiInvestmentAnalyst(samplePrompt)).rejects.toMatchObject({ code: "not_configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sends the Anthropic API key via the x-api-key header and never in the URL or body text", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({ content: [{ type: "text", text: "{}" }] }));
    global.fetch = fetchSpy as unknown as typeof fetch;

    const { callAiInvestmentAnalyst } = await importFreshClient();
    await callAiInvestmentAnalyst(samplePrompt);

    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).not.toContain("test-ai-key-456");
    expect((init as RequestInit).headers).toMatchObject({ "x-api-key": "test-ai-key-456" });
  });

  it("only ever calls the hardcoded Anthropic endpoint", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({ content: [{ type: "text", text: "{}" }] }));
    global.fetch = fetchSpy as unknown as typeof fetch;

    const { callAiInvestmentAnalyst } = await importFreshClient();
    await callAiInvestmentAnalyst(samplePrompt);

    const [url] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe("https://api.anthropic.com/v1/messages");
  });

  it("routes to the OpenAI endpoint and Authorization header when AI_PROVIDER=openai", async () => {
    process.env.AI_PROVIDER = "openai";
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({ choices: [{ message: { content: "{}" } }] }));
    global.fetch = fetchSpy as unknown as typeof fetch;

    const { callAiInvestmentAnalyst } = await importFreshClient();
    await callAiInvestmentAnalyst(samplePrompt);

    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe("https://api.openai.com/v1/chat/completions");
    expect((init as RequestInit).headers).toMatchObject({ Authorization: "Bearer test-ai-key-456" });
  });

  it("classifies a 401 response as invalid_api_key", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({}, 401)) as unknown as typeof fetch;
    const { callAiInvestmentAnalyst } = await importFreshClient();
    await expect(callAiInvestmentAnalyst(samplePrompt)).rejects.toMatchObject({ code: "invalid_api_key" });
  });

  it("classifies a 429 response as rate_limited", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({}, 429)) as unknown as typeof fetch;
    const { callAiInvestmentAnalyst } = await importFreshClient();
    await expect(callAiInvestmentAnalyst(samplePrompt)).rejects.toMatchObject({ code: "rate_limited" });
  });

  it("classifies a 402 response as quota_exceeded", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({}, 402)) as unknown as typeof fetch;
    const { callAiInvestmentAnalyst } = await importFreshClient();
    await expect(callAiInvestmentAnalyst(samplePrompt)).rejects.toMatchObject({ code: "quota_exceeded" });
  });

  it("classifies a network failure (fetch throws) as network_error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("fetch failed")) as unknown as typeof fetch;
    const { callAiInvestmentAnalyst } = await importFreshClient();
    await expect(callAiInvestmentAnalyst(samplePrompt)).rejects.toMatchObject({ code: "network_error" });
  });

  it("classifies an AbortError as timeout", async () => {
    const abortError = new DOMException("The operation was aborted", "AbortError");
    global.fetch = vi.fn().mockRejectedValue(abortError) as unknown as typeof fetch;
    const { callAiInvestmentAnalyst } = await importFreshClient();
    await expect(callAiInvestmentAnalyst(samplePrompt)).rejects.toMatchObject({ code: "timeout" });
  });

  it("classifies unparseable JSON as malformed_response", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response("not json", { status: 200 })) as unknown as typeof fetch;
    const { callAiInvestmentAnalyst } = await importFreshClient();
    await expect(callAiInvestmentAnalyst(samplePrompt)).rejects.toMatchObject({ code: "malformed_response" });
  });

  it("classifies a response with no readable text as malformed_response", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ content: [] })) as unknown as typeof fetch;
    const { callAiInvestmentAnalyst } = await importFreshClient();
    await expect(callAiInvestmentAnalyst(samplePrompt)).rejects.toMatchObject({ code: "malformed_response" });
  });

  it("never surfaces the API key in a thrown error message", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({}, 500)) as unknown as typeof fetch;
    const { callAiInvestmentAnalyst } = await importFreshClient();
    try {
      await callAiInvestmentAnalyst(samplePrompt);
      throw new Error("expected callAiInvestmentAnalyst to reject");
    } catch (err) {
      expect(String((err as Error).message)).not.toContain("test-ai-key-456");
    }
  });
});
