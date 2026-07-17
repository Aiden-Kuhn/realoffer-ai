"use server";

import { isAiAnalysisEnabled } from "@/config/env";
import { buildInvestmentAnalysisContext } from "@/lib/investmentAnalysis/buildContext";
import { computeDealScore } from "@/lib/investmentAnalysis/dealScore";
import { computeRecommendation } from "@/lib/investmentAnalysis/recommendation";
import { computeOfferGuidance } from "@/lib/investmentAnalysis/offerGuidance";
import { computeSensitivityAnalysis } from "@/lib/investmentAnalysis/sensitivity";
import { computeAnalysisInputHash } from "@/lib/investmentAnalysis/inputHash";
import { AIInvestmentAnalysisProvider } from "@/lib/investmentAnalysis/aiProvider";
import { RuleBasedInvestmentAnalysisProvider } from "@/lib/investmentAnalysis/ruleBasedProvider";
import { cacheKey, getCached, getInFlight, trackInFlight } from "@/lib/investmentAnalysis/cache";
import type { GenerateAnalysisParams } from "@/lib/investmentAnalysis/provider";
import type { InvestmentAnalysisResult, CachedAnalysisOrigin } from "@/lib/investmentAnalysis/types";
import type { RepairEstimateState } from "@/lib/calculations/repairs";
import type { ComparableSale, PropertyRecord } from "@/lib/property/types";
import type { DealFinancialResults } from "@/lib/calculations/types";
import type { DealAssumptions } from "@/types/deal";

const ruleBasedProvider = new RuleBasedInvestmentAnalysisProvider();

export type InvestmentAnalysisResponse = {
  result: InvestmentAnalysisResult;
  origin: CachedAnalysisOrigin;
};

/**
 * The one server entry point the client calls to generate (or reuse) an
 * Investment Analyst result for a deal's *current* state. Always computes
 * the deterministic score/recommendation/offer-guidance/sensitivity first
 * — those never depend on whether the AI call succeeds. Tries AI only when
 * configured, and always falls back to the rule-based provider on any
 * failure so the feature never dead-ends.
 */
export async function generateInvestmentAnalysis(
  dealId: string,
  property: PropertyRecord,
  comparables: ComparableSale[],
  repairEstimate: RepairEstimateState,
  assumptions: DealAssumptions,
  results: DealFinancialResults,
  options?: { forceRegenerate?: boolean },
): Promise<InvestmentAnalysisResponse> {
  const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
  const dealScore = computeDealScore(context);
  const recommendation = computeRecommendation(context);
  const offerGuidance = computeOfferGuidance(context);
  const sensitivity = computeSensitivityAnalysis(context);
  const inputHash = computeAnalysisInputHash(property, comparables, repairEstimate, assumptions);

  const key = cacheKey(dealId, inputHash);

  if (!options?.forceRegenerate) {
    const cached = getCached(key);
    if (cached) return { result: cached, origin: "cache" };

    const pending = getInFlight(key);
    if (pending) {
      const result = await pending;
      return { result, origin: result.source };
    }
  }

  const params: GenerateAnalysisParams = { context, dealScore, recommendation, offerGuidance, sensitivity, inputHash };

  const promise = (async (): Promise<InvestmentAnalysisResult> => {
    if (isAiAnalysisEnabled()) {
      try {
        return await new AIInvestmentAnalysisProvider().generate(params);
      } catch {
        // Any AI failure (missing config, invalid key, rate limit, quota,
        // timeout, network error, malformed/schema-invalid output even
        // after one repair attempt) falls back to the always-available
        // rule-based provider — the feature must never dead-end.
        return ruleBasedProvider.generate(params);
      }
    }
    return ruleBasedProvider.generate(params);
  })();

  const result = await trackInFlight(key, promise);
  return { result, origin: result.source };
}

export async function isInvestmentAnalystAiEnabled(): Promise<boolean> {
  return isAiAnalysisEnabled();
}
