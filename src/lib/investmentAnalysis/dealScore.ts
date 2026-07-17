import {
  DEAL_SCORE_LABELS,
  DEAL_SCORE_TARGETS,
  DEAL_SCORE_WEIGHTS,
  INSUFFICIENT_INFO_SCORE_CAP,
} from "@/config/investmentAnalysis";
import type { DealScoreBreakdownItem, InvestmentAnalysisContext, RealOfferDealScore } from "@/lib/investmentAnalysis/types";

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Deterministic 0-100 "RealOffer Deal Score." Every component is a plain
 * function of already-computed facts (see InvestmentAnalysisContext) — the
 * AI never influences this number, so the score stays identical whether or
 * not an AI explanation was ever generated. See config/investmentAnalysis.ts
 * for the weights and rationale.
 */
export function computeDealScore(context: InvestmentAnalysisContext): RealOfferDealScore {
  const { calculatedOutputs, comparables, property, repairs } = context;
  const breakdown: DealScoreBreakdownItem[] = [];

  // Buyer cushion: how much room exists below MAO at the proposed price.
  const cushionRatio = clamp01(calculatedOutputs.remainingBuyerCushionCents / DEAL_SCORE_TARGETS.cushionCentsForFullPoints);
  const cushionPoints = calculatedOutputs.remainingBuyerCushionCents > 0 ? Math.round(cushionRatio * DEAL_SCORE_WEIGHTS.cushion) : 0;
  breakdown.push({
    component: "Buyer cushion",
    pointsEarned: cushionPoints,
    pointsPossible: DEAL_SCORE_WEIGHTS.cushion,
    explanation: `Remaining buyer cushion below MAO scaled against a $${(DEAL_SCORE_TARGETS.cushionCentsForFullPoints / 100).toLocaleString()} target.`,
  });

  // Return on cost.
  const rocRatio = clamp01(calculatedOutputs.investorReturnOnCost / DEAL_SCORE_TARGETS.returnOnCostForFullPoints);
  const rocPoints = calculatedOutputs.investorReturnOnCost > 0 ? Math.round(rocRatio * DEAL_SCORE_WEIGHTS.returnOnCost) : 0;
  breakdown.push({
    component: "Return on cost",
    pointsEarned: rocPoints,
    pointsPossible: DEAL_SCORE_WEIGHTS.returnOnCost,
    explanation: `Projected return on cost scaled against a ${(DEAL_SCORE_TARGETS.returnOnCostForFullPoints * 100).toFixed(0)}% target.`,
  });

  // Projected profit.
  const profitRatio = clamp01(calculatedOutputs.projectedInvestorProfitCents / DEAL_SCORE_TARGETS.profitCentsForFullPoints);
  const profitPoints =
    calculatedOutputs.projectedInvestorProfitCents > 0 ? Math.round(profitRatio * DEAL_SCORE_WEIGHTS.profit) : 0;
  breakdown.push({
    component: "Projected profit",
    pointsEarned: profitPoints,
    pointsPossible: DEAL_SCORE_WEIGHTS.profit,
    explanation: `Projected investor profit scaled against a $${(DEAL_SCORE_TARGETS.profitCentsForFullPoints / 100).toLocaleString()} target.`,
  });

  // Comparable quality: count of included comps + their average similarity.
  const includedComps = comparables.selected;
  const countRatio = clamp01(includedComps.length / DEAL_SCORE_TARGETS.comparableCountForFullPoints);
  const avgSimilarity =
    includedComps.length > 0 ? includedComps.reduce((sum, c) => sum + c.similarityScore, 0) / includedComps.length / 100 : 0;
  const comparablePoints = Math.round((countRatio * 0.6 + clamp01(avgSimilarity) * 0.4) * DEAL_SCORE_WEIGHTS.comparableQuality);
  breakdown.push({
    component: "Comparable quality",
    pointsEarned: comparablePoints,
    pointsPossible: DEAL_SCORE_WEIGHTS.comparableQuality,
    explanation: `${includedComps.length} comp(s) included, average similarity ${(avgSimilarity * 100).toFixed(0)}%.`,
  });

  // Data completeness / provider confidence.
  const confidencePoints = { high: 1, medium: 0.6, low: 0.2 }[property.confidence];
  const missingPenalty = Math.min(property.missingFields.length * 0.15, confidencePoints);
  const dataPoints = Math.round(clamp01(confidencePoints - missingPenalty) * DEAL_SCORE_WEIGHTS.dataCompleteness);
  breakdown.push({
    component: "Data completeness",
    pointsEarned: dataPoints,
    pointsPossible: DEAL_SCORE_WEIGHTS.dataCompleteness,
    explanation: `${property.confidence} provider confidence, ${property.missingFields.length} missing field(s).`,
  });

  // Repair-estimate confidence: a per-sqft or category basis is more
  // grounded than an unexplained manual total; a nonzero total is required.
  const hasBasis = repairs.estimationMethod !== "manual" || repairs.expectedRepairTotalCents > 0;
  const repairPoints = repairs.expectedRepairTotalCents > 0 ? (hasBasis ? DEAL_SCORE_WEIGHTS.repairConfidence : Math.round(DEAL_SCORE_WEIGHTS.repairConfidence * 0.4)) : 0;
  breakdown.push({
    component: "Repair-estimate confidence",
    pointsEarned: repairPoints,
    pointsPossible: DEAL_SCORE_WEIGHTS.repairConfidence,
    explanation: `Estimated via ${repairs.estimationMethod.replace("_", " ")}.`,
  });

  // Days on market — a mild, hedged signal only; never treated as proof of
  // seller motivation (see the recommendation/narrative copy).
  const dom = property.daysOnMarket;
  const domPoints = dom === null ? 0 : dom > 90 ? DEAL_SCORE_WEIGHTS.daysOnMarket : dom > 30 ? Math.round(DEAL_SCORE_WEIGHTS.daysOnMarket * 0.6) : Math.round(DEAL_SCORE_WEIGHTS.daysOnMarket * 0.3);
  breakdown.push({
    component: "Days on market",
    pointsEarned: domPoints,
    pointsPossible: DEAL_SCORE_WEIGHTS.daysOnMarket,
    explanation: dom === null ? "Not available — no points either way." : `${dom} days on market (longer listings may allow more negotiating room, not a guarantee).`,
  });

  // List-price reduction — same hedging as above.
  const priceReductionPoints = property.listPriceReducedFromOriginal && property.originalListPriceCents && property.listPriceCents
    ? Math.round(clamp01((property.originalListPriceCents - property.listPriceCents) / property.originalListPriceCents / 0.1) * DEAL_SCORE_WEIGHTS.priceReduction)
    : 0;
  breakdown.push({
    component: "List price reduction",
    pointsEarned: priceReductionPoints,
    pointsPossible: DEAL_SCORE_WEIGHTS.priceReduction,
    explanation: property.listPriceReducedFromOriginal
      ? "List price has been reduced from the original — may indicate room to negotiate, not a guarantee."
      : "No price-reduction data available — no points either way.",
  });

  let score = breakdown.reduce((sum, item) => sum + item.pointsEarned, 0);
  score = Math.min(100, Math.max(0, score));

  const isInsufficientInfo = context.calculatedOutputs.dealClassificationKey === "insufficient_information";
  if (isInsufficientInfo) {
    score = Math.min(score, INSUFFICIENT_INFO_SCORE_CAP);
  }

  const band = DEAL_SCORE_LABELS.find((b) => score >= b.min) ?? DEAL_SCORE_LABELS[DEAL_SCORE_LABELS.length - 1];

  return {
    score,
    label: band.label,
    labelText: band.text,
    breakdown,
  };
}
