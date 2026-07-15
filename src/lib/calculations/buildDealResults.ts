import { suggestArvFromComparables } from "@/lib/calculations/arv";
import { computeDealFinancials } from "@/lib/calculations/engine";
import { computeRepairTotalCents } from "@/lib/calculations/repairs";
import type { DealFinancialResults } from "@/lib/calculations/types";
import { hasSufficientPropertyInfo } from "@/lib/property/completeness";
import type { ComparableSale, PropertyRecord } from "@/lib/property/types";
import type { DealAssumptions } from "@/types/deal";
import type { RepairEstimateState } from "@/lib/calculations/repairs";

export function resolveSelectedArvCents(
  property: PropertyRecord,
  comparables: ComparableSale[],
  arvOverrideCents: number | null,
): number {
  if (arvOverrideCents !== null) return arvOverrideCents;

  const suggestion = suggestArvFromComparables(comparables, {
    lowCents: property.arvLowCents,
    expectedCents: property.arvExpectedCents,
    highCents: property.arvHighCents,
  });
  return suggestion.expectedCents;
}

export function buildDealFinancialResults(
  property: PropertyRecord,
  comparables: ComparableSale[],
  repairEstimate: RepairEstimateState,
  assumptions: DealAssumptions,
): DealFinancialResults {
  const selectedArvCents = resolveSelectedArvCents(property, comparables, assumptions.arvOverrideCents);
  const repairCostCents = computeRepairTotalCents(repairEstimate, property.squareFootage);

  return computeDealFinancials(
    {
      listPriceCents: property.listPriceCents ?? 0,
      contractPriceCents: assumptions.contractPriceCents,
      arvCents: selectedArvCents,
      repairCostCents,
      desiredAssignmentFeeCents: assumptions.desiredAssignmentFeeCents,
      buyerClosingCostsCents: assumptions.buyerClosingCostsCents,
      holdingCostsCents: assumptions.holdingCostsCents,
      financingCostsCents: assumptions.financingCostsCents,
      sellingCostsCents: assumptions.sellingCostsCents,
      investorTargetProfitCents: assumptions.investorTargetProfitCents,
      investorArvPercentage: assumptions.investorArvPercentage,
      maoMethod: assumptions.maoMethod,
    },
    { hasSufficientPropertyInfo: hasSufficientPropertyInfo(property) },
  );
}
