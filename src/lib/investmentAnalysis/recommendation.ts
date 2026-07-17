import { formatCents, formatPercent } from "@/lib/calculations/money";
import type { DeterministicRecommendation, InvestmentAnalysisContext, RecommendationKey } from "@/lib/investmentAnalysis/types";

const RECOMMENDATION_LABELS: Record<RecommendationKey, string> = {
  pursue_at_current_assumptions: "Appears worth pursuing at current assumptions",
  pursue_if_negotiated_lower: "Consider pursuing only if negotiated lower",
  verify_repairs_and_comparables: "Verify repairs and comparables before proceeding",
  insufficient_information: "Insufficient information to make a recommendation",
  does_not_meet_targets: "Does not currently meet targets",
};

/**
 * Grounded, cautious recommendation logic. Every branch reads only the
 * already-computed deterministic outputs — this never asks (or lets) an AI
 * model decide the recommendation; it can only explain it.
 */
export function computeRecommendation(context: InvestmentAnalysisContext): DeterministicRecommendation {
  const { calculatedOutputs, comparables, property } = context;
  const classification = calculatedOutputs.dealClassificationKey;

  const hasMajorRiskFlags =
    property.missingFields.length > 0 || property.confidence === "low" || comparables.selected.length < 3;

  const keyAssumptions = [
    `Selected ARV: ${formatCents(comparables.selectedArvCents)}${comparables.arvManuallyOverridden ? " (manually overridden)" : ""}`,
    `Estimated repairs: ${formatCents(context.repairs.expectedRepairTotalCents)}`,
    `Proposed contract price: ${formatCents(context.assumptions.proposedContractPriceCents)}`,
    `Maximum allowable offer: ${formatCents(calculatedOutputs.maximumAllowableOfferCents)}`,
  ];

  const verificationItems = [
    ...(property.missingFields.length > 0 ? [`Missing property data: ${property.missingFields.join(", ")}`] : []),
    ...(comparables.selected.length < 3 ? ["Fewer than 3 comparable sales are currently included in the ARV estimate"] : []),
    ...(property.confidence === "low" ? ["Provider data confidence is low for this record"] : []),
    "Independently verify the actual condition and repair scope with an in-person walkthrough or inspection",
  ];

  let key: RecommendationKey;
  let reasons: string[];
  let whatWouldChangeThis: string[];

  if (classification === "insufficient_information") {
    key = "insufficient_information";
    reasons = ["Key property details (square footage, bedrooms, bathrooms, year built, or a usable ARV) are missing."];
    whatWouldChangeThis = ["Confirm the missing property details, or enter them manually, so a reliable classification can be made."];
  } else if (classification === "does_not_meet_targets") {
    if (calculatedOutputs.maximumAllowableOfferCents > 0) {
      key = "pursue_if_negotiated_lower";
      reasons = [
        `The proposed contract price (${formatCents(context.assumptions.proposedContractPriceCents)}) is above the maximum allowable offer (${formatCents(calculatedOutputs.maximumAllowableOfferCents)}).`,
        `At the current price, projected profit is ${formatCents(calculatedOutputs.projectedInvestorProfitCents)}.`,
      ];
      whatWouldChangeThis = [
        `A contract price at or below ${formatCents(calculatedOutputs.maximumAllowableOfferCents)} would bring this within target range.`,
        "A higher ARV (from stronger comparables) or lower repair costs would also raise the maximum allowable offer.",
      ];
    } else {
      key = "does_not_meet_targets";
      reasons = [
        "Even at a very low contract price, projected costs exceed the current ARV, so the maximum allowable offer is at or below zero.",
        `Projected profit at the current assumptions is ${formatCents(calculatedOutputs.projectedInvestorProfitCents)}.`,
      ];
      whatWouldChangeThis = [
        "A meaningfully higher ARV or lower repair/holding costs would be needed before this deal could work.",
      ];
    }
  } else if (hasMajorRiskFlags) {
    key = "verify_repairs_and_comparables";
    reasons = [
      `Deal classification is currently "${calculatedOutputs.dealClassification}", but the underlying data has gaps that affect confidence.`,
      ...(property.missingFields.length > 0 ? [`Missing: ${property.missingFields.join(", ")}.`] : []),
      ...(comparables.selected.length < 3 ? [`Only ${comparables.selected.length} comparable sale(s) are currently included.`] : []),
    ];
    whatWouldChangeThis = ["Filling in the missing property details or including more comparable sales would increase confidence in this result."];
  } else if (classification === "thin_margin") {
    key = "pursue_if_negotiated_lower";
    reasons = [
      `Buyer cushion (${formatCents(calculatedOutputs.remainingBuyerCushionCents)}) and profit (${formatCents(calculatedOutputs.projectedInvestorProfitCents)}) are positive but thin.`,
      `Return on cost is ${formatPercent(calculatedOutputs.investorReturnOnCost)}.`,
    ];
    whatWouldChangeThis = ["A lower contract price or higher ARV would widen the margin and reduce downside risk."];
  } else {
    key = "pursue_at_current_assumptions";
    reasons = [
      `Deal classification is "${calculatedOutputs.dealClassification}" with a buyer cushion of ${formatCents(calculatedOutputs.remainingBuyerCushionCents)} and projected profit of ${formatCents(calculatedOutputs.projectedInvestorProfitCents)}.`,
    ];
    whatWouldChangeThis = ["A significant ARV drop, repair-cost increase, or comparable-sale revision could change this assessment — see the sensitivity scenarios."];
  }

  return {
    recommendation: key,
    recommendationLabel: RECOMMENDATION_LABELS[key],
    reasons,
    keyAssumptions,
    whatWouldChangeThis,
    requiresVerification: verificationItems,
  };
}
