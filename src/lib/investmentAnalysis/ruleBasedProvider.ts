import { ANALYSIS_VERSION } from "@/config/investmentAnalysis";
import { formatCents, formatPercent } from "@/lib/calculations/money";
import type {
  AiNarrative,
  DeterministicRecommendation,
  InvestmentAnalysisContext,
  InvestmentAnalysisResult,
  RealOfferDealScore,
  SensitivityAnalysis,
} from "@/lib/investmentAnalysis/types";
import type { GenerateAnalysisParams, InvestmentAnalysisProvider } from "@/lib/investmentAnalysis/provider";

/**
 * Always-available, no-AI-required explanation. Used whenever no AI
 * provider is configured, the AI request fails, quota/rate limits are hit,
 * or the user hasn't opted into AI — the Investment Analyst must stay
 * useful without any third-party API. Every sentence here is templated
 * directly from the deterministic context; nothing is invented.
 */
export function generateRuleBasedNarrative(
  context: InvestmentAnalysisContext,
  dealScore: RealOfferDealScore,
  recommendation: DeterministicRecommendation,
  sensitivity: SensitivityAnalysis,
): AiNarrative {
  const { property, comparables, repairs, assumptions, calculatedOutputs } = context;

  const executiveSummary = buildExecutiveSummary(context, dealScore, recommendation);
  const strengths = buildStrengths(context);
  const risks = buildRisks(context);
  const missingInformation = Array.from(new Set([...property.missingFields, ...context.sourceAndConfidence.missingFields]));

  const priceAnalysis = `Proposed contract price is ${formatCents(assumptions.proposedContractPriceCents)}${
    property.listPriceCents !== null ? `, versus a list price of ${formatCents(property.listPriceCents)}` : ""
  }. The maximum allowable offer at current assumptions is ${formatCents(calculatedOutputs.maximumAllowableOfferCents)}, leaving a buyer cushion of ${formatCents(calculatedOutputs.remainingBuyerCushionCents)}.`;

  const repairAnalysis = `Repairs are estimated at ${formatCents(repairs.expectedRepairTotalCents)} using the ${repairs.estimationMethod.replace("_", " ")} method (${repairs.conditionPreset.replace(/_/g, " ")} preset). This is a planning estimate, not a contractor bid or inspection finding.`;

  const arvAnalysis = `Selected ARV is ${formatCents(comparables.selectedArvCents)}${comparables.arvManuallyOverridden ? " (manually overridden by the user)" : ` (suggested range ${formatCents(comparables.suggestedArvLowCents)}–${formatCents(comparables.suggestedArvHighCents)})`}.`;

  const comparableAnalysis = `${comparables.selected.length} comparable sale(s) are currently included and ${comparables.excluded.length} excluded from the ARV calculation.`;

  const negotiationPoints = buildNegotiationPoints(context, sensitivity);
  const nextSteps = Array.from(new Set(recommendation.requiresVerification));

  const { confidence, confidenceReasons } = buildConfidence(context);

  const warnings: string[] = [];
  if (context.sourceAndConfidence.isDemoData) {
    warnings.push("This analysis is based on simulated demo data, not a live property record.");
  }
  if (property.confidence === "low") {
    warnings.push("Underlying property data confidence is low — treat all figures as a rough starting point.");
  }

  return {
    executiveSummary,
    strengths: strengths.length > 0 ? strengths : ["No standout strengths identified from the current data — see risks below."],
    risks: risks.length > 0 ? risks : ["No major risk flags identified from the current data."],
    missingInformation,
    priceAnalysis,
    repairAnalysis,
    arvAnalysis,
    comparableAnalysis,
    negotiationPoints,
    nextSteps,
    confidence,
    confidenceReasons,
    warnings,
  };
}

function buildExecutiveSummary(
  context: InvestmentAnalysisContext,
  dealScore: RealOfferDealScore,
  recommendation: DeterministicRecommendation,
): string {
  const { calculatedOutputs } = context;
  return (
    `RealOffer Deal Score: ${dealScore.score}/100 (${dealScore.labelText}). ${recommendation.recommendationLabel}. ` +
    `Based on the current assumptions, projected investor profit is ${formatCents(calculatedOutputs.projectedInvestorProfitCents)} ` +
    `with a return on cost of ${formatPercent(calculatedOutputs.investorReturnOnCost)}. This is a data-driven starting point, not a guarantee — review the details below before making an offer.`
  );
}

function buildStrengths(context: InvestmentAnalysisContext): string[] {
  const { calculatedOutputs, comparables, property } = context;
  const strengths: string[] = [];

  if (calculatedOutputs.remainingBuyerCushionCents > 0) {
    strengths.push(`Positive buyer cushion of ${formatCents(calculatedOutputs.remainingBuyerCushionCents)} below the maximum allowable offer.`);
  }
  if (calculatedOutputs.projectedInvestorProfitCents > 0) {
    strengths.push(`Projected investor profit of ${formatCents(calculatedOutputs.projectedInvestorProfitCents)} at current assumptions.`);
  }
  if (comparables.selected.length >= 5) {
    strengths.push(`${comparables.selected.length} comparable sales support the ARV estimate.`);
  }
  if (property.confidence === "high") {
    strengths.push("Provider data confidence is high for this property record.");
  }
  if (property.listPriceReducedFromOriginal) {
    strengths.push("The list price has been reduced from its original value, which may indicate some room to negotiate — not a guarantee.");
  }

  return strengths;
}

function buildRisks(context: InvestmentAnalysisContext): string[] {
  const { calculatedOutputs, comparables, property } = context;
  const risks: string[] = [];

  if (calculatedOutputs.remainingBuyerCushionCents < 0) {
    risks.push("The proposed contract price plus assignment fee exceeds the maximum allowable offer.");
  }
  if (calculatedOutputs.projectedInvestorProfitCents <= 0) {
    risks.push("Projected investor profit is zero or negative at the current assumptions.");
  }
  if (property.missingFields.length > 0) {
    risks.push(`Missing property data: ${property.missingFields.join(", ")}.`);
  }
  if (property.confidence === "low") {
    risks.push("Provider data confidence is low for this property record.");
  }
  if (comparables.selected.length < 3) {
    risks.push("Fewer than 3 comparable sales are included — the ARV estimate may be less reliable.");
  }
  if (property.daysOnMarket !== null && property.daysOnMarket > 90) {
    risks.push(`This listing has been on market for ${property.daysOnMarket} days — investigate why before making an offer.`);
  }

  return risks;
}

function buildNegotiationPoints(context: InvestmentAnalysisContext, sensitivity: SensitivityAnalysis): string[] {
  const points: string[] = [];
  const { property, calculatedOutputs } = context;

  if (property.listPriceCents !== null && property.listPriceCents > calculatedOutputs.maximumAllowableOfferCents) {
    points.push(`List price (${formatCents(property.listPriceCents)}) is above the maximum allowable offer (${formatCents(calculatedOutputs.maximumAllowableOfferCents)}).`);
  }
  if (property.listPriceReducedFromOriginal) {
    points.push("A prior price reduction may be a useful reference point in conversation, though it doesn't guarantee further flexibility.");
  }
  const conservative = sensitivity.scenarios.find((s) => s.key === "conservative");
  if (conservative && conservative.projectedInvestorProfitCents < 0) {
    points.push("Under conservative assumptions (lower ARV, higher repairs), this deal would run negative — useful context for how much room exists.");
  }
  points.push("You control all offers and negotiations — this is a starting point for your own conversation, not a script.");

  return points;
}

function buildConfidence(context: InvestmentAnalysisContext): { confidence: "high" | "medium" | "low"; confidenceReasons: string[] } {
  const { property, comparables } = context;
  const reasons: string[] = [];
  let points = 0;

  if (property.confidence === "high") {
    points += 2;
  } else if (property.confidence === "medium") {
    points += 1;
  } else {
    reasons.push("Provider data confidence is low.");
  }

  if (property.missingFields.length === 0) {
    points += 1;
  } else {
    reasons.push(`${property.missingFields.length} property field(s) are missing.`);
  }

  if (comparables.selected.length >= 3) {
    points += 1;
  } else {
    reasons.push("Fewer than 3 comparable sales are included.");
  }

  const confidence: "high" | "medium" | "low" = points >= 3 ? "high" : points >= 1 ? "medium" : "low";
  if (reasons.length === 0) reasons.push("Property data is complete and comparable sales support the ARV estimate.");

  return { confidence, confidenceReasons: reasons };
}

/**
 * Always-available fallback provider — no network call, no API key, works
 * identically offline or when the AI provider is unavailable/unconfigured.
 */
export class RuleBasedInvestmentAnalysisProvider implements InvestmentAnalysisProvider {
  readonly name = "rule_based";

  async generate(params: GenerateAnalysisParams): Promise<InvestmentAnalysisResult> {
    const narrative = generateRuleBasedNarrative(params.context, params.dealScore, params.recommendation, params.sensitivity);
    return {
      dealScore: params.dealScore,
      recommendation: params.recommendation,
      offerGuidance: params.offerGuidance,
      sensitivity: params.sensitivity,
      narrative,
      source: "rule_based",
      provider: null,
      model: null,
      generatedAt: new Date().toISOString(),
      analysisVersion: ANALYSIS_VERSION,
      inputHash: params.inputHash,
    };
  }
}
