import { computeDealFinancials } from "@/lib/calculations/engine";
import { MAX_REASONABLE_CENTS } from "@/lib/calculations/money";
import { DEAL_CLASSIFICATION_LABELS } from "@/config/dealClassification";
import { SENSITIVITY_SCENARIOS, SUGGESTED_OPENING_OFFER_DISCOUNT } from "@/config/investmentAnalysis";
import type { DealFinancialInputs } from "@/lib/calculations/types";
import type { InvestmentAnalysisContext, SensitivityAnalysis, SensitivityScenarioResult, SensitivityScenarioKey } from "@/lib/investmentAnalysis/types";

type ScenarioDefinition = {
  key: SensitivityScenarioKey;
  label: string;
  description: string;
  arvMultiplier?: number;
  repairMultiplier?: number;
  holdingMultiplier?: number;
  contractPriceCents?: (baseInputs: DealFinancialInputs, maoCents: number, suggestedOfferCents: number) => number;
};

function baseInputsFromContext(context: InvestmentAnalysisContext): DealFinancialInputs {
  return {
    listPriceCents: context.property.listPriceCents ?? 0,
    contractPriceCents: context.assumptions.proposedContractPriceCents,
    arvCents: context.comparables.selectedArvCents,
    repairCostCents: context.repairs.expectedRepairTotalCents,
    desiredAssignmentFeeCents: context.assumptions.desiredAssignmentFeeCents,
    buyerClosingCostsCents: context.assumptions.buyerClosingCostsCents,
    holdingCostsCents: context.assumptions.holdingCostsCents,
    financingCostsCents: context.assumptions.financingCostsCents,
    sellingCostsCents: context.assumptions.sellingCostsCents,
    investorTargetProfitCents: context.assumptions.investorTargetProfitCents,
    investorArvPercentage: context.assumptions.investorArvPercentage,
    maoMethod: context.assumptions.maoMethod,
  };
}

/** Mirrors lib/property/completeness.ts's hasSufficientPropertyInfo, using
 * only what's already present on the context (the property itself doesn't
 * change across scenarios, so this is computed once and reused). */
function hasSufficientInfo(context: InvestmentAnalysisContext): boolean {
  return (
    context.property.squareFootage !== null &&
    context.property.bedrooms !== null &&
    context.property.bathrooms !== null &&
    context.property.yearBuilt !== null &&
    context.comparables.suggestedArvExpectedCents > 0
  );
}

function buildScenarioDefinitions(): ScenarioDefinition[] {
  const s = SENSITIVITY_SCENARIOS;
  return [
    { key: "base", label: "Base case", description: "Current selected ARV, repair estimate, and cost assumptions.", arvMultiplier: 1, repairMultiplier: 1, holdingMultiplier: 1 },
    {
      key: "conservative",
      label: "Conservative case",
      description: `ARV ${Math.round((1 - s.conservative.arvMultiplier) * 100)}% lower, repairs ${Math.round((s.conservative.repairMultiplier - 1) * 100)}% higher, holding costs ${Math.round((s.conservative.holdingMultiplier - 1) * 100)}% higher.`,
      ...s.conservative,
    },
    {
      key: "optimistic",
      label: "Optimistic case",
      description: `ARV ${Math.round((s.optimistic.arvMultiplier - 1) * 100)}% higher, repairs ${Math.round((1 - s.optimistic.repairMultiplier) * 100)}% lower. Clearly optimistic — do not treat as expected.`,
      ...s.optimistic,
    },
    { key: "repairsUp10", label: "Repairs +10%", description: "Repair estimate increased by 10%, everything else unchanged.", repairMultiplier: s.repairsUp10.repairMultiplier },
    { key: "repairsUp20", label: "Repairs +20%", description: "Repair estimate increased by 20%, everything else unchanged.", repairMultiplier: s.repairsUp20.repairMultiplier },
    { key: "arvDown5", label: "ARV -5%", description: "Selected ARV reduced by 5%, everything else unchanged.", arvMultiplier: s.arvDown5.arvMultiplier },
    { key: "arvDown10", label: "ARV -10%", description: "Selected ARV reduced by 10%, everything else unchanged.", arvMultiplier: s.arvDown10.arvMultiplier },
    { key: "holdingCostsUp50", label: "Holding costs +50%", description: "Holding costs increased by 50% (e.g. a longer hold than planned), everything else unchanged.", holdingMultiplier: s.holdingCostsUp50.holdingMultiplier },
    {
      key: "contractAtMao",
      label: "Contract price at MAO",
      description: "Proposed contract price reduced to exactly the maximum allowable offer.",
      contractPriceCents: (_base, maoCents) => Math.max(0, maoCents),
    },
    {
      key: "contractAtSuggestedOffer",
      label: "Contract price at suggested opening offer",
      description: `Proposed contract price reduced to the suggested opening offer (${Math.round(SUGGESTED_OPENING_OFFER_DISCOUNT * 100)}% below MAO).`,
      contractPriceCents: (_base, _mao, suggestedOfferCents) => suggestedOfferCents,
    },
  ];
}

/**
 * Deterministic sensitivity analysis — every scenario is run through the
 * exact same `computeDealFinancials` used for the live deal. The AI may
 * summarize these results but never calculates them; see aiProvider.ts.
 */
export function computeSensitivityAnalysis(context: InvestmentAnalysisContext): SensitivityAnalysis {
  const baseInputs = baseInputsFromContext(context);
  const sufficientInfo = hasSufficientInfo(context);

  // The suggested-opening-offer scenario needs the base case's MAO first.
  const baseResults = computeDealFinancials(baseInputs, { hasSufficientPropertyInfo: sufficientInfo });
  const suggestedOfferCents = Math.max(
    0,
    Math.round(baseResults.maximumAllowableOfferCents * (1 - SUGGESTED_OPENING_OFFER_DISCOUNT)),
  );

  const scenarios = buildScenarioDefinitions().map((def): SensitivityScenarioResult => {
    // Multipliers (e.g. optimistic ARV x1.05, holdingCostsUp50 x1.5) can push
    // a base value that's already near MAX_REASONABLE_CENTS past the engine's
    // validation ceiling, which would otherwise throw inside this useMemo and
    // crash the whole section — clamp every derived monetary input the same
    // way the source form fields are clamped.
    const arvCents = Math.min(Math.round(baseInputs.arvCents * (def.arvMultiplier ?? 1)), MAX_REASONABLE_CENTS);
    const repairCostCents = Math.min(Math.round(baseInputs.repairCostCents * (def.repairMultiplier ?? 1)), MAX_REASONABLE_CENTS);
    const holdingCostsCents = Math.min(Math.round(baseInputs.holdingCostsCents * (def.holdingMultiplier ?? 1)), MAX_REASONABLE_CENTS);
    const contractPriceCents = Math.min(
      def.contractPriceCents
        ? def.contractPriceCents(baseInputs, baseResults.maximumAllowableOfferCents, suggestedOfferCents)
        : baseInputs.contractPriceCents,
      MAX_REASONABLE_CENTS,
    );

    const inputs: DealFinancialInputs = {
      ...baseInputs,
      arvCents,
      repairCostCents,
      holdingCostsCents,
      contractPriceCents,
    };

    const results = computeDealFinancials(inputs, { hasSufficientPropertyInfo: sufficientInfo });

    return {
      key: def.key,
      label: def.label,
      description: def.description,
      arvCents,
      repairCostCents,
      contractPriceCents,
      projectedInvestorProfitCents: results.projectedInvestorProfitCents,
      maximumAllowableOfferCents: results.maximumAllowableOfferCents,
      remainingBuyerCushionCents: results.remainingBuyerCushionCents,
      investorReturnOnCost: results.investorReturnOnCost,
      dealClassification: DEAL_CLASSIFICATION_LABELS[results.dealClassification],
    };
  });

  return { scenarios };
}
