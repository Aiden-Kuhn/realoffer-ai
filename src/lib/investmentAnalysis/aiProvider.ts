import "server-only";
import { ANALYSIS_VERSION } from "@/config/investmentAnalysis";
import { getAiModel, getAiProvider } from "@/config/env";
import { AiProviderError, callAiInvestmentAnalyst } from "@/lib/investmentAnalysis/aiClient";
import { buildInvestmentAnalysisPrompt } from "@/lib/investmentAnalysis/prompt";
import { aiNarrativeSchema, type AiNarrative, type InvestmentAnalysisResult } from "@/lib/investmentAnalysis/types";
import type { GenerateAnalysisParams, InvestmentAnalysisProvider } from "@/lib/investmentAnalysis/provider";

/** Strips a ```json ... ``` (or bare ```) fence if the model wrapped its
 * output in one despite being told not to — a cheap, safe normalization
 * step, not a "repair" in the retry sense. */
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

function tryParseNarrative(rawText: string): { ok: true; narrative: AiNarrative } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(rawText));
  } catch {
    return { ok: false, error: "Response was not valid JSON." };
  }

  const result = aiNarrativeSchema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  }
  return { ok: true, narrative: result.data };
}

/**
 * AI-backed provider. Receives only the deterministic context/score/
 * recommendation/sensitivity that were already computed elsewhere — it can
 * only produce narrative explanation text (validated against
 * aiNarrativeSchema), never a number the deterministic engine didn't
 * produce. On any failure (network, invalid key, rate limit, malformed or
 * schema-invalid output after one repair attempt), throws — the caller
 * (service.ts) is responsible for falling back to the rule-based provider.
 */
export class AIInvestmentAnalysisProvider implements InvestmentAnalysisProvider {
  readonly name = "ai";

  async generate(params: GenerateAnalysisParams): Promise<InvestmentAnalysisResult> {
    const prompt = buildInvestmentAnalysisPrompt(params.context, params.dealScore, params.recommendation, params.sensitivity);

    const firstAttempt = await callAiInvestmentAnalyst(prompt);
    const firstParse = tryParseNarrative(firstAttempt);

    let narrative: AiNarrative;
    if (firstParse.ok) {
      narrative = firstParse.narrative;
    } else {
      // One controlled repair attempt: tell the model exactly what was
      // wrong and ask for corrected JSON only. If this also fails, we
      // give up and let the caller fall back to the rule-based provider.
      const repairPrompt = {
        system: prompt.system,
        user: `${prompt.user}\n\nYour previous response could not be used: ${firstParse.error}\n\nReturn ONLY the corrected JSON object matching the schema exactly — no markdown fences, no commentary.`,
      };
      const secondAttempt = await callAiInvestmentAnalyst(repairPrompt);
      const secondParse = tryParseNarrative(secondAttempt);
      if (!secondParse.ok) {
        throw new AiProviderError("malformed_response", "The AI provider did not return a usable structured response.");
      }
      narrative = secondParse.narrative;
    }

    return {
      dealScore: params.dealScore,
      recommendation: params.recommendation,
      offerGuidance: params.offerGuidance,
      sensitivity: params.sensitivity,
      narrative,
      source: "ai",
      provider: getAiProvider(),
      model: getAiModel(),
      generatedAt: new Date().toISOString(),
      analysisVersion: ANALYSIS_VERSION,
      inputHash: params.inputHash,
    };
  }
}
