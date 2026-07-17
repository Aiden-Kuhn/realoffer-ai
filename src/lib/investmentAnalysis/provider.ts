import type {
  DeterministicRecommendation,
  InvestmentAnalysisContext,
  InvestmentAnalysisResult,
  OfferGuidance,
  RealOfferDealScore,
  SensitivityAnalysis,
} from "@/lib/investmentAnalysis/types";

/**
 * Inputs every provider receives — always the deterministic outputs, never
 * raw provider payloads or secrets. Both implementations (AI and
 * rule-based) receive the exact same deterministic facts; only how they
 * turn them into narrative text differs.
 */
export type GenerateAnalysisParams = {
  context: InvestmentAnalysisContext;
  dealScore: RealOfferDealScore;
  recommendation: DeterministicRecommendation;
  offerGuidance: OfferGuidance;
  sensitivity: SensitivityAnalysis;
  inputHash: string;
};

/**
 * Common seam for any investment-analysis explanation backend. Swapping
 * the AI vendor, or disabling AI entirely, never requires UI changes —
 * every implementation returns the same InvestmentAnalysisResult shape.
 */
export interface InvestmentAnalysisProvider {
  readonly name: string;
  generate(params: GenerateAnalysisParams): Promise<InvestmentAnalysisResult>;
}
