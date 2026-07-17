import { buildInvestmentAnalysisContext } from "@/lib/investmentAnalysis/buildContext";
import { computeDealScore } from "@/lib/investmentAnalysis/dealScore";
import { computeRecommendation } from "@/lib/investmentAnalysis/recommendation";
import { computeAnalysisInputHash } from "@/lib/investmentAnalysis/inputHash";
import type { DeterministicRecommendation, RealOfferDealScore } from "@/lib/investmentAnalysis/types";
import type { Deal } from "@/types/deal";

export type DealInsights = {
  dealScore: RealOfferDealScore;
  recommendation: DeterministicRecommendation;
  /** Whether this deal has ever had a narrative (AI or rule-based) generated. */
  hasAnalysis: boolean;
  /** True only when an analysis exists AND the assumptions it was generated
   * from no longer match the deal's current saved assumptions. */
  isStale: boolean;
};

/**
 * Deal score and recommendation are pure, deterministic, and require no AI
 * call — so every saved deal gets them "for free" the moment it's listed,
 * whether or not the user ever clicked Generate Analysis on it.
 */
export function deriveDealInsights(deal: Deal): DealInsights {
  const context = buildInvestmentAnalysisContext(deal.property, deal.comparables, deal.repairEstimate, deal.assumptions, deal.results);
  const dealScore = computeDealScore(context);
  const recommendation = computeRecommendation(context);

  const hasAnalysis = deal.investmentAnalysis != null;
  const isStale = hasAnalysis && deal.investmentAnalysis!.inputHash !== computeAnalysisInputHash(deal.property, deal.comparables, deal.repairEstimate, deal.assumptions);

  return { dealScore, recommendation, hasAnalysis, isStale };
}
