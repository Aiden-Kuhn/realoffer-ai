/**
 * Server-only environment access. Never import this from a "use client"
 * component — it exists specifically so the RentCast and AI API keys never
 * reach client code (no NEXT_PUBLIC_ prefix is ever used for either).
 */
import "server-only";

export type PropertyDataMode = "rentcast" | "demo";

export function getPropertyDataMode(): PropertyDataMode {
  const raw = process.env.PROPERTY_DATA_MODE?.trim().toLowerCase();
  return raw === "rentcast" ? "rentcast" : "demo";
}

export function getRentCastApiKey(): string | null {
  const key = process.env.RENTCAST_API_KEY?.trim();
  return key ? key : null;
}

/** True when real RentCast lookups are both requested and actually configured. */
export function isRentCastEnabled(): boolean {
  return getPropertyDataMode() === "rentcast" && getRentCastApiKey() !== null;
}

/**
 * The AI vendor whose request/response shape the server-only AI client
 * should speak. Unrecognized or unset values leave AI analysis disabled —
 * the rule-based Investment Analyst provider always keeps the feature
 * usable, so an unset/typo'd provider fails closed, not open.
 */
export type AiProvider = "anthropic" | "openai";

const KNOWN_AI_PROVIDERS: readonly AiProvider[] = ["anthropic", "openai"];

export function getAiProvider(): AiProvider | null {
  const raw = process.env.AI_PROVIDER?.trim().toLowerCase();
  return (KNOWN_AI_PROVIDERS as readonly string[]).includes(raw ?? "") ? (raw as AiProvider) : null;
}

export function getAiApiKey(): string | null {
  const key = process.env.AI_API_KEY?.trim();
  return key ? key : null;
}

/** Falls back to a sensible current default per vendor when AI_MODEL is unset. */
export function getAiModel(): string {
  const configured = process.env.AI_MODEL?.trim();
  if (configured) return configured;
  return getAiProvider() === "openai" ? "gpt-4o-mini" : "claude-sonnet-5";
}

/** True when an AI provider, key, and (implicitly) model are all configured. */
export function isAiAnalysisEnabled(): boolean {
  return getAiProvider() !== null && getAiApiKey() !== null;
}
