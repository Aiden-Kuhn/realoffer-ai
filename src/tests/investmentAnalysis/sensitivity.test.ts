import { describe, expect, it } from "vitest";
import { buildInvestmentAnalysisContext } from "@/lib/investmentAnalysis/buildContext";
import { computeSensitivityAnalysis } from "@/lib/investmentAnalysis/sensitivity";
import { computeDealFinancials } from "@/lib/calculations/engine";
import { MAX_REASONABLE_CENTS } from "@/lib/calculations/money";
import { SENSITIVITY_SCENARIOS } from "@/config/investmentAnalysis";
import { makeAssumptions, makeComparables, makeProperty, makeRepairEstimate, makeResults, makeStrongDealFixtures } from "@/tests/investmentAnalysis/fixtures";

describe("computeSensitivityAnalysis", () => {
  it("includes exactly the ten documented scenarios", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const sensitivity = computeSensitivityAnalysis(context);
    const keys = sensitivity.scenarios.map((s) => s.key);
    expect(keys).toEqual([
      "base",
      "conservative",
      "optimistic",
      "repairsUp10",
      "repairsUp20",
      "arvDown5",
      "arvDown10",
      "holdingCostsUp50",
      "contractAtMao",
      "contractAtSuggestedOffer",
    ]);
  });

  it("the base scenario matches the live deal's own results exactly", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const sensitivity = computeSensitivityAnalysis(context);
    const base = sensitivity.scenarios.find((s) => s.key === "base")!;
    expect(base.projectedInvestorProfitCents).toBe(results.projectedInvestorProfitCents);
    expect(base.maximumAllowableOfferCents).toBe(results.maximumAllowableOfferCents);
  });

  it("repairsUp10 recomputes through the real deterministic engine, not an approximation", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const sensitivity = computeSensitivityAnalysis(context);
    const scenario = sensitivity.scenarios.find((s) => s.key === "repairsUp10")!;

    const expectedRepairCents = Math.round(context.repairs.expectedRepairTotalCents * SENSITIVITY_SCENARIOS.repairsUp10.repairMultiplier);
    const expected = computeDealFinancials(
      {
        listPriceCents: property.listPriceCents ?? 0,
        contractPriceCents: assumptions.contractPriceCents,
        arvCents: context.comparables.selectedArvCents,
        repairCostCents: expectedRepairCents,
        desiredAssignmentFeeCents: assumptions.desiredAssignmentFeeCents,
        buyerClosingCostsCents: assumptions.buyerClosingCostsCents,
        holdingCostsCents: assumptions.holdingCostsCents,
        financingCostsCents: assumptions.financingCostsCents,
        sellingCostsCents: assumptions.sellingCostsCents,
        investorTargetProfitCents: assumptions.investorTargetProfitCents,
        investorArvPercentage: assumptions.investorArvPercentage,
        maoMethod: assumptions.maoMethod,
      },
      { hasSufficientPropertyInfo: true },
    );

    expect(scenario.repairCostCents).toBe(expectedRepairCents);
    expect(scenario.projectedInvestorProfitCents).toBe(expected.projectedInvestorProfitCents);
    expect(scenario.maximumAllowableOfferCents).toBe(expected.maximumAllowableOfferCents);
  });

  it("contractAtMao sets the scenario's contract price to the base case's MAO", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const sensitivity = computeSensitivityAnalysis(context);
    const base = sensitivity.scenarios.find((s) => s.key === "base")!;
    const atMao = sensitivity.scenarios.find((s) => s.key === "contractAtMao")!;
    expect(atMao.contractPriceCents).toBe(base.maximumAllowableOfferCents);
  });

  it("the conservative scenario is never more favorable than the base case for a normal deal", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const sensitivity = computeSensitivityAnalysis(context);
    const base = sensitivity.scenarios.find((s) => s.key === "base")!;
    const conservative = sensitivity.scenarios.find((s) => s.key === "conservative")!;
    expect(conservative.projectedInvestorProfitCents).toBeLessThanOrEqual(base.projectedInvestorProfitCents);
  });

  it("the optimistic scenario is never worse than the base case for a normal deal", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const sensitivity = computeSensitivityAnalysis(context);
    const base = sensitivity.scenarios.find((s) => s.key === "base")!;
    const optimistic = sensitivity.scenarios.find((s) => s.key === "optimistic")!;
    expect(optimistic.projectedInvestorProfitCents).toBeGreaterThanOrEqual(base.projectedInvestorProfitCents);
  });

  it("never throws even when repair or ARV multipliers push values to zero", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const zeroRepairs = { ...repairEstimate, mode: "manual" as const, manualTotalCents: 0 };
    const context = buildInvestmentAnalysisContext(property, comparables, zeroRepairs, assumptions, results);
    expect(() => computeSensitivityAnalysis(context)).not.toThrow();
  });

  it("never throws and clamps derived values when a multiplier would push an already-near-ceiling input past MAX_REASONABLE_CENTS", () => {
    // ARV, repairs, and holding costs are each independently clamped to
    // MAX_REASONABLE_CENTS at the UI layer, but a value already near that
    // ceiling combined with a >1 multiplier (optimistic ARV x1.05,
    // holdingCostsUp50 x1.5, etc.) can still overflow the ceiling unless
    // sensitivity.ts clamps the *derived* value too.
    const property = makeProperty({ arvLowCents: MAX_REASONABLE_CENTS, arvExpectedCents: MAX_REASONABLE_CENTS, arvHighCents: MAX_REASONABLE_CENTS });
    const comparables = makeComparables(5);
    const repairEstimate = makeRepairEstimate({ manualTotalCents: MAX_REASONABLE_CENTS });
    const assumptions = makeAssumptions({ contractPriceCents: MAX_REASONABLE_CENTS, holdingCostsCents: MAX_REASONABLE_CENTS });
    const results = makeResults(assumptions, property, MAX_REASONABLE_CENTS);
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);

    expect(() => computeSensitivityAnalysis(context)).not.toThrow();
    const sensitivity = computeSensitivityAnalysis(context);
    for (const scenario of sensitivity.scenarios) {
      expect(scenario.arvCents).toBeLessThanOrEqual(MAX_REASONABLE_CENTS);
      expect(scenario.repairCostCents).toBeLessThanOrEqual(MAX_REASONABLE_CENTS);
      expect(scenario.contractPriceCents).toBeLessThanOrEqual(MAX_REASONABLE_CENTS);
    }
  });
});
