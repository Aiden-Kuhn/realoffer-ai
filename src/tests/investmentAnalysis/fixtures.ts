import { computeDealFinancials } from "@/lib/calculations/engine";
import { createDefaultRepairEstimateState } from "@/lib/calculations/repairs";
import type { DealFinancialInputs, DealFinancialResults } from "@/lib/calculations/types";
import type { RepairEstimateState } from "@/lib/calculations/repairs";
import type { ComparableSale, PropertyRecord } from "@/lib/property/types";
import type { DealAssumptions } from "@/types/deal";

export function makeProperty(overrides: Partial<PropertyRecord> = {}): PropertyRecord {
  return {
    address: { line1: "123 Main St", city: "Austin", state: "TX", zip: "78701", formatted: "123 MAIN ST, AUSTIN, TX 78701" },
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1800,
    lotSizeSqft: 6000,
    yearBuilt: 1995,
    propertyType: "single_family",
    county: "Travis",
    latitude: 30.27,
    longitude: -97.74,
    lastSaleDate: "2020-05-01",
    lastSalePriceCents: 25_000_000,
    taxAssessedValueCents: 27_000_000,
    annualPropertyTaxCents: 500_000,
    providerRecordId: "rc-123",
    listPriceCents: 30_000_000,
    originalListPriceCents: 32_000_000,
    listingStatus: "Active",
    listedDate: "2026-01-01",
    daysOnMarket: 45,
    mlsId: "MLS123",
    hoaFeeCents: 0,
    propertySubtype: null,
    description: "A nice house.",
    currentValueCents: 31_000_000,
    valuationRangeLowCents: 29_000_000,
    valuationRangeHighCents: 33_000_000,
    valuationDate: "2026-01-15",
    arvLowCents: 33_000_000,
    arvExpectedCents: 35_000_000,
    arvHighCents: 37_000_000,
    suggestedRepairCostCents: 3_000_000,
    comparables: [],
    source: "rentcast",
    confidence: "high",
    lastUpdated: "2026-01-15T00:00:00.000Z",
    ...overrides,
  };
}

export function makeComparable(overrides: Partial<ComparableSale> = {}): ComparableSale {
  return {
    id: "comp-1",
    address: "456 Oak St, Austin, TX",
    salePriceCents: 34_000_000,
    saleDate: "2025-11-01",
    distanceMiles: 0.5,
    squareFootage: 1780,
    pricePerSqftCents: 19_101,
    bedrooms: 3,
    bathrooms: 2,
    similarityScore: 92,
    similaritySource: "provider",
    saleType: "sold",
    source: "rentcast",
    providerId: "rc-comp-1",
    included: true,
    ...overrides,
  };
}

export function makeComparables(count = 4, overrides: Partial<ComparableSale> = {}): ComparableSale[] {
  return Array.from({ length: count }, (_, i) =>
    makeComparable({ id: `comp-${i + 1}`, address: `${i + 1}00 Test St, Austin, TX`, ...overrides }),
  );
}

export function makeRepairEstimate(overrides: Partial<RepairEstimateState> = {}): RepairEstimateState {
  return { ...createDefaultRepairEstimateState("moderate_renovation"), mode: "manual", manualTotalCents: 3_000_000, ...overrides };
}

export function makeAssumptions(overrides: Partial<DealAssumptions> = {}): DealAssumptions {
  return {
    contractPriceCents: 24_000_000,
    arvOverrideCents: null,
    desiredAssignmentFeeCents: 1_000_000,
    buyerClosingCostsCents: 600_000,
    holdingCostsCents: 800_000,
    financingCostsCents: 500_000,
    sellingCostsCents: 1_800_000,
    investorTargetProfitCents: 2_000_000,
    investorArvPercentage: 0.7,
    maoMethod: "PERCENTAGE_OF_ARV",
    ...overrides,
  };
}

export function makeResults(assumptions: DealAssumptions, property: PropertyRecord, repairCostCents: number): DealFinancialResults {
  const inputs: DealFinancialInputs = {
    listPriceCents: property.listPriceCents ?? 0,
    contractPriceCents: assumptions.contractPriceCents,
    arvCents: assumptions.arvOverrideCents ?? property.arvExpectedCents,
    repairCostCents,
    desiredAssignmentFeeCents: assumptions.desiredAssignmentFeeCents,
    buyerClosingCostsCents: assumptions.buyerClosingCostsCents,
    holdingCostsCents: assumptions.holdingCostsCents,
    financingCostsCents: assumptions.financingCostsCents,
    sellingCostsCents: assumptions.sellingCostsCents,
    investorTargetProfitCents: assumptions.investorTargetProfitCents,
    investorArvPercentage: assumptions.investorArvPercentage,
    maoMethod: assumptions.maoMethod,
  };
  return computeDealFinancials(inputs, { hasSufficientPropertyInfo: true });
}

/**
 * Complete, internally-consistent fixture sets for each deal-classification
 * shape — all numbers below were derived from the real MAO formula
 * (see lib/calculations/engine.ts) so `results` is always mathematically
 * consistent with `assumptions`/`property`, not just plausible-looking.
 */
export function makeStrongDealFixtures() {
  const property = makeProperty({ arvLowCents: 38_000_000, arvExpectedCents: 40_000_000, arvHighCents: 42_000_000 });
  const comparables = makeComparables(5);
  const repairEstimate = makeRepairEstimate({ manualTotalCents: 3_000_000 });
  const assumptions = makeAssumptions({ contractPriceCents: 15_000_000 });
  const results = makeResults(assumptions, property, 3_000_000);
  return { property, comparables, repairEstimate, assumptions, results };
}

/** Positive MAO, but the proposed contract price is above it — the
 * "pursue only if negotiated lower" case. */
export function makeNegotiableDealFixtures() {
  const property = makeProperty({ arvLowCents: 38_000_000, arvExpectedCents: 40_000_000, arvHighCents: 42_000_000 });
  const comparables = makeComparables(5);
  const repairEstimate = makeRepairEstimate({ manualTotalCents: 3_000_000 });
  const assumptions = makeAssumptions({ contractPriceCents: 38_000_000 });
  const results = makeResults(assumptions, property, 3_000_000);
  return { property, comparables, repairEstimate, assumptions, results };
}

/** MAO itself is at or below zero — no price makes this deal work today. */
export function makeDoesNotMeetTargetsFixtures() {
  const property = makeProperty({ arvLowCents: 9_500_000, arvExpectedCents: 10_000_000, arvHighCents: 10_500_000 });
  const comparables = makeComparables(5);
  const repairEstimate = makeRepairEstimate({ manualTotalCents: 3_000_000 });
  const assumptions = makeAssumptions({ contractPriceCents: 5_000_000 });
  const results = makeResults(assumptions, property, 3_000_000);
  return { property, comparables, repairEstimate, assumptions, results };
}

export function makeInsufficientInfoFixtures() {
  const property = makeProperty({ bedrooms: null, bathrooms: null, squareFootage: null, yearBuilt: null, arvExpectedCents: 0, arvLowCents: 0, arvHighCents: 0 });
  const comparables: ComparableSale[] = [];
  const repairEstimate = makeRepairEstimate({ manualTotalCents: 0 });
  const assumptions = makeAssumptions({ contractPriceCents: 0 });
  const results = computeDealFinancials(
    {
      listPriceCents: 0,
      contractPriceCents: 0,
      arvCents: 0,
      repairCostCents: 0,
      desiredAssignmentFeeCents: assumptions.desiredAssignmentFeeCents,
      buyerClosingCostsCents: assumptions.buyerClosingCostsCents,
      holdingCostsCents: assumptions.holdingCostsCents,
      financingCostsCents: assumptions.financingCostsCents,
      sellingCostsCents: assumptions.sellingCostsCents,
      investorTargetProfitCents: assumptions.investorTargetProfitCents,
      investorArvPercentage: assumptions.investorArvPercentage,
      maoMethod: assumptions.maoMethod,
    },
    { hasSufficientPropertyInfo: false },
  );
  return { property, comparables, repairEstimate, assumptions, results };
}
