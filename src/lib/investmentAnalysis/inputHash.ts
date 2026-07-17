import { hashString } from "@/lib/property/seededRandom";
import { ANALYSIS_VERSION } from "@/config/investmentAnalysis";
import type { ComparableSale, PropertyRecord } from "@/lib/property/types";
import type { RepairEstimateState } from "@/lib/calculations/repairs";
import type { DealAssumptions } from "@/types/deal";

/**
 * Stable hash of everything that would change the Investment Analyst's
 * output: property identity + last-refreshed timestamp, selected ARV,
 * repair inputs, contract/cost assumptions, which comparables are
 * included, the MAO method, and the analysis schema version.
 *
 * Used both server-side (cache key, so unchanged inputs reuse a cached
 * result instead of spending a new AI request) and client-side (to detect
 * that a saved analysis is stale without needing a round-trip). Not a
 * security hash — collision resistance doesn't matter here, only stability.
 */
export function computeAnalysisInputHash(
  property: PropertyRecord,
  comparables: ComparableSale[],
  repairEstimate: RepairEstimateState,
  assumptions: DealAssumptions,
): string {
  const includedComparableIds = comparables
    .filter((c) => c.included)
    .map((c) => c.id)
    .sort();

  const canonical = {
    v: ANALYSIS_VERSION,
    address: property.address.formatted,
    propertyUpdatedAt: property.lastUpdated,
    arv: assumptions.arvOverrideCents ?? property.arvExpectedCents,
    arvOverridden: assumptions.arvOverrideCents !== null,
    repairMode: repairEstimate.mode,
    repairPreset: repairEstimate.conditionPreset,
    repairPerSqft: repairEstimate.perSqftRateCents,
    repairManual: repairEstimate.manualTotalCents,
    repairCategories: repairEstimate.categories,
    contractPriceCents: assumptions.contractPriceCents,
    assignmentFeeCents: assumptions.desiredAssignmentFeeCents,
    buyerClosingCostsCents: assumptions.buyerClosingCostsCents,
    holdingCostsCents: assumptions.holdingCostsCents,
    financingCostsCents: assumptions.financingCostsCents,
    sellingCostsCents: assumptions.sellingCostsCents,
    investorTargetProfitCents: assumptions.investorTargetProfitCents,
    investorArvPercentage: assumptions.investorArvPercentage,
    maoMethod: assumptions.maoMethod,
    includedComparableIds,
  };

  return hashString(JSON.stringify(canonical)).toString(36);
}
