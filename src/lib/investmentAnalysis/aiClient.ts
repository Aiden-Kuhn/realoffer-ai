import "server-only";
import { getAiApiKey, getAiModel, getAiProvider } from "@/config/env";
import type { PromptBundle } from "@/lib/investmentAnalysis/prompt";

export type AiProviderErrorCode =
  | "not_configured"
  | "invalid_api_key"
  | "rate_limited"
  | "quota_exceeded"
  | "timeout"
  | "network_error"
  | "malformed_response"
  | "unknown";

export class AiProviderError extends Error {
  code: AiProviderErrorCode;
  constructor(code: AiProviderErrorCode, message: string) {
    super(message);
    this.name = "AiProviderError";
    this.code = code;
  }
}

const REQUEST_TIMEOUT_MS = 25_000;
const MAX_OUTPUT_TOKENS = 2_000;

// Hardcoded, approved endpoints only — never a caller-supplied URL.
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

let devRequestCount = 0;

function logDevRequest(provider: string): void {
  if (process.env.NODE_ENV === "production") return;
  devRequestCount += 1;
  // Intentionally logs only the vendor name and a running count — never the
  // API key, prompt content, or response body.
  console.log(`[ai-investment-analyst] request #${devRequestCount} -> ${provider}`);
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new AiProviderError("timeout", "The AI provider took too long to respond.");
    }
    throw new AiProviderError("network_error", "Couldn't reach the AI provider.");
  } finally {
    clearTimeout(timeout);
  }
}

function classifyHttpStatus(status: number): AiProviderErrorCode | null {
  if (status === 401 || status === 403) return "invalid_api_key";
  if (status === 429) return "rate_limited";
  if (status === 402) return "quota_exceeded";
  if (status >= 500) return "unknown";
  return status === 200 ? null : "unknown";
}

async function callAnthropic(apiKey: string, model: string, prompt: PromptBundle): Promise<string> {
  const response = await fetchWithTimeout(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
    }),
  });

  const code = classifyHttpStatus(response.status);
  if (code) throw new AiProviderError(code, `The AI provider returned an unexpected error (${response.status}).`);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new AiProviderError("malformed_response", "The AI provider returned a response that couldn't be read.");
  }

  const content = (body as { content?: Array<{ type?: string; text?: string }> })?.content;
  const text = content?.find((block) => block.type === "text")?.text;
  if (typeof text !== "string" || text.length === 0) {
    throw new AiProviderError("malformed_response", "The AI provider's response didn't contain readable text.");
  }
  return text;
}

async function callOpenAi(apiKey: string, model: string, prompt: PromptBundle): Promise<string> {
  const response = await fetchWithTimeout(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
    }),
  });

  const code = classifyHttpStatus(response.status);
  if (code) throw new AiProviderError(code, `The AI provider returned an unexpected error (${response.status}).`);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new AiProviderError("malformed_response", "The AI provider returned a response that couldn't be read.");
  }

  const text = (body as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || text.length === 0) {
    throw new AiProviderError("malformed_response", "The AI provider's response didn't contain readable text.");
  }
  return text;
}

/**
 * Calls the configured AI vendor and returns its raw text response (expected
 * to be a JSON string per the prompt contract — validated by the caller,
 * never trusted here). Throws AiProviderError, never leaks the API key in
 * any error message, and never accepts a caller-supplied URL.
 */
export async function callAiInvestmentAnalyst(prompt: PromptBundle): Promise<string> {
  const provider = getAiProvider();
  const apiKey = getAiApiKey();
  if (!provider || !apiKey) {
    throw new AiProviderError("not_configured", "AI analysis isn't configured on this server.");
  }
  const model = getAiModel();

  logDevRequest(provider);

  if (provider === "anthropic") return callAnthropic(apiKey, model, prompt);
  return callOpenAi(apiKey, model, prompt);
}
