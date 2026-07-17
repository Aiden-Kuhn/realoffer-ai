import { describe, expect, it } from "vitest";
import { normalizeLegacyDeal } from "@/lib/repositories/dealMigration";

/** Shaped exactly like a deal saved before this milestone — no dataMode,
 * no PropertyRecord listing/valuation fields, source is always "simulated",
 * and comparables lack similaritySource/saleType/providerId. */
const legacyDealJson = {
  id: "legacy-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  status: "draft",
  notes: "old note",
  property: {
    address: { line1: "1 Old St", city: "Austin", state: "TX", zip: "78701", formatted: "1 OLD ST, AUSTIN, TX 78701" },
    listPriceCents: 30_000_000,
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1500,
    lotSizeSqft: 5000,
    yearBuilt: 1990,
    propertyType: "single_family",
    daysOnMarket: 10,
    description: "An old demo listing.",
    source: "simulated",
    confidence: "high",
    lastUpdated: "2026-01-01T00:00:00.000Z",
    arvLowCents: 39_000_000,
    arvExpectedCents: 42_000_000,
    arvHighCents: 45_000_000,
    suggestedRepairCostCents: 3_000_000,
    comparables: [
      {
        id: "comp-1",
        address: "2 Old St, Austin, TX",
        salePriceCents: 41_000_000,
        saleDate: "2025-12-01",
        distanceMiles: 0.5,
        squareFootage: 1520,
        pricePerSqftCents: 27_000,
        bedrooms: 3,
        bathrooms: 2,
        similarityScore: 88,
        source: "simulated",
        included: true,
      },
    ],
    profile: "strong",
  },
  comparables: [],
  assumptions: {
    contractPriceCents: 28_000_000,
    arvOverrideCents: null,
    desiredAssignmentFeeCents: 1_000_000,
    buyerClosingCostsCents: 600_000,
    holdingCostsCents: 160_000,
    financingCostsCents: 600_000,
    sellingCostsCents: 2_400_000,
    investorTargetProfitCents: 2_000_000,
    investorArvPercentage: 0.7,
    maoMethod: "PERCENTAGE_OF_ARV",
  },
  repairEstimate: {
    mode: "manual",
    conditionPreset: "moderate_renovation",
    perSqftRateCents: 2_750,
    categories: {},
    manualTotalCents: 3_000_000,
  },
  results: {
    endBuyerPurchasePriceCents: 29_000_000,
    totalRepairCostCents: 3_000_000,
    totalInvestorCostsCents: 6_760_000,
    allInProjectCostCents: 35_760_000,
    projectedInvestorProfitCents: 6_240_000,
    investorReturnOnCost: 0.17,
    investorMarginOnArv: 0.15,
    wholesaleAssignmentSpreadCents: 1_000_000,
    breakEvenResalePriceCents: 35_760_000,
    maximumAllowableOfferCents: 27_800_000,
    remainingBuyerCushionCents: -1_200_000,
    dealClassification: "thin_margin",
  },
};

describe("normalizeLegacyDeal", () => {
  it("backfills dataMode as demo for a pre-RentCast deal", () => {
    const migrated = normalizeLegacyDeal(legacyDealJson);
    expect(migrated.dataMode).toBe("demo");
  });

  it("preserves all pre-existing top-level fields", () => {
    const migrated = normalizeLegacyDeal(legacyDealJson);
    expect(migrated.id).toBe("legacy-1");
    expect(migrated.notes).toBe("old note");
    expect(migrated.status).toBe("draft");
    expect(migrated.results.projectedInvestorProfitCents).toBe(6_240_000);
  });

  it("backfills new PropertyRecord fields as null rather than undefined", () => {
    const migrated = normalizeLegacyDeal(legacyDealJson);
    expect(migrated.property.currentValueCents).toBeNull();
    expect(migrated.property.valuationRangeLowCents).toBeNull();
    expect(migrated.property.mlsId).toBeNull();
    expect(migrated.property.hoaFeeCents).toBeNull();
    expect(migrated.property.county).toBeNull();
    expect(migrated.property.listingStatus).toBe("Active"); // inferred from the legacy listPriceCents being present
  });

  it("preserves existing property facts unchanged", () => {
    const migrated = normalizeLegacyDeal(legacyDealJson);
    expect(migrated.property.bedrooms).toBe(3);
    expect(migrated.property.squareFootage).toBe(1500);
    expect(migrated.property.source).toBe("simulated");
  });

  it("backfills new ComparableSale fields on legacy comparables", () => {
    const migrated = normalizeLegacyDeal(legacyDealJson);
    const comp = migrated.property.comparables[0];
    expect(comp.similaritySource).toBe("calculated");
    expect(comp.saleType).toBe("sold");
    expect(comp.providerId).toBeNull();
  });

  it("does not throw on a deal missing the property object entirely", () => {
    expect(() => normalizeLegacyDeal({ ...legacyDealJson, property: undefined })).not.toThrow();
  });

  it("respects an explicit dataMode if one is already present", () => {
    const migrated = normalizeLegacyDeal({ ...legacyDealJson, dataMode: "real" });
    expect(migrated.dataMode).toBe("real");
  });

  it("does not throw on a record missing assumptions, results, and repairEstimate entirely", () => {
    const partial = { ...legacyDealJson, assumptions: undefined, results: undefined, repairEstimate: undefined };
    expect(() => normalizeLegacyDeal(partial)).not.toThrow();
  });

  it("backfills a usable results object (not undefined) when results is missing", () => {
    const partial = { ...legacyDealJson, results: undefined };
    const migrated = normalizeLegacyDeal(partial);
    expect(migrated.results).toBeDefined();
    expect(Number.isFinite(migrated.results.maximumAllowableOfferCents)).toBe(true);
    expect(migrated.results.dealClassification).toBe("insufficient_information");
  });

  it("backfills usable assumptions and repairEstimate when both are missing", () => {
    const partial = { ...legacyDealJson, assumptions: undefined, repairEstimate: undefined };
    const migrated = normalizeLegacyDeal(partial);
    expect(migrated.assumptions.maoMethod).toBe("PERCENTAGE_OF_ARV");
    expect(migrated.repairEstimate.mode).toBeDefined();
  });

  it("backfills id, createdAt, status, and notes when entirely absent", () => {
    const partial = {
      ...legacyDealJson,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      status: undefined,
      notes: undefined,
    };
    const migrated = normalizeLegacyDeal(partial);
    expect(typeof migrated.id).toBe("string");
    expect(migrated.id.length).toBeGreaterThan(0);
    expect(migrated.status).toBe("draft");
    expect(migrated.notes).toBe("");
    expect(Date.parse(migrated.createdAt)).not.toBeNaN();
    expect(Date.parse(migrated.updatedAt)).not.toBeNaN();
  });

  it("opens a deal saved before the Investment Analyst milestone with investmentAnalysis left undefined", () => {
    // legacyDealJson predates the investmentAnalysis field entirely — it's
    // never present in the raw JSON, exactly like a real old saved deal.
    const migrated = normalizeLegacyDeal(legacyDealJson);
    expect(migrated.investmentAnalysis).toBeUndefined();
  });

  it("does not throw and does not fabricate an analysis for a deal that never had one generated", () => {
    expect(() => normalizeLegacyDeal(legacyDealJson)).not.toThrow();
    const migrated = normalizeLegacyDeal(legacyDealJson);
    expect(migrated.investmentAnalysis).toBeUndefined();
  });

  function makeValidInvestmentAnalysis(overrides: Record<string, unknown> = {}) {
    return {
      dealScore: { score: 80, label: "worth_investigating", labelText: "Worth Investigating", breakdown: [] },
      recommendation: { recommendation: "pursue_at_current_assumptions", recommendationLabel: "test", reasons: [], keyAssumptions: [], whatWouldChangeThis: [], requiresVerification: [] },
      offerGuidance: { suggestedOpeningOfferCents: 0, maximumRecommendedOfferCents: 0, existingMaoCents: 0, differenceFromListPriceCents: null, differenceFromProposedContractCents: 0, discountBelowMaxUsed: 0.06 },
      sensitivity: { scenarios: [] },
      narrative: {
        executiveSummary: "test",
        strengths: [],
        risks: [],
        missingInformation: [],
        priceAnalysis: "test",
        repairAnalysis: "test",
        arvAnalysis: "test",
        comparableAnalysis: "test",
        negotiationPoints: [],
        nextSteps: [],
        confidence: "medium",
        confidenceReasons: [],
        warnings: [],
      },
      source: "rule_based",
      provider: null,
      model: null,
      generatedAt: "2026-01-01T00:00:00.000Z",
      analysisVersion: 1,
      inputHash: "test-hash",
      ...overrides,
    };
  }

  it("does not throw and discards a hand-corrupted `investmentAnalysis: null` back to undefined", () => {
    const corrupted = { ...legacyDealJson, investmentAnalysis: null };
    expect(() => normalizeLegacyDeal(corrupted)).not.toThrow();
    expect(normalizeLegacyDeal(corrupted).investmentAnalysis).toBeUndefined();
  });

  it("discards an investmentAnalysis whose narrative array field was corrupted to null", () => {
    const corrupted = { ...legacyDealJson, investmentAnalysis: makeValidInvestmentAnalysis({ narrative: { ...makeValidInvestmentAnalysis().narrative, strengths: null } }) };
    const migrated = normalizeLegacyDeal(corrupted);
    expect(migrated.investmentAnalysis).toBeUndefined();
  });

  it("discards an investmentAnalysis missing inputHash entirely", () => {
    const corrupted = { ...legacyDealJson, investmentAnalysis: makeValidInvestmentAnalysis({ inputHash: undefined }) };
    const migrated = normalizeLegacyDeal(corrupted);
    expect(migrated.investmentAnalysis).toBeUndefined();
  });

  it("preserves a well-formed investmentAnalysis unchanged", () => {
    const valid = makeValidInvestmentAnalysis();
    const deal = { ...legacyDealJson, investmentAnalysis: valid };
    const migrated = normalizeLegacyDeal(deal);
    expect(migrated.investmentAnalysis).toEqual(valid);
  });
});
