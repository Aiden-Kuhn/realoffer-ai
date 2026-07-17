import { describe, expect, it } from "vitest";
import { buildInvestmentAnalysisContext } from "@/lib/investmentAnalysis/buildContext";
import { investmentAnalysisContextSchema } from "@/lib/investmentAnalysis/types";
import { makeInsufficientInfoFixtures, makeStrongDealFixtures } from "@/tests/investmentAnalysis/fixtures";

describe("buildInvestmentAnalysisContext", () => {
  it("produces a context that validates against its own zod schema", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    expect(() => investmentAnalysisContextSchema.parse(context)).not.toThrow();
  });

  it("never includes an API key, auth token, or provider record id", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const serialized = JSON.stringify(context);
    expect(serialized).not.toContain("providerRecordId");
    expect(serialized.toLowerCase()).not.toContain("apikey");
    expect(serialized.toLowerCase()).not.toContain("api_key");
    expect(serialized.toLowerCase()).not.toContain("password");
    expect(serialized.toLowerCase()).not.toContain("token");
  });

  it("never includes raw MLS id or latitude/longitude (not needed for analysis)", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const serialized = JSON.stringify(context);
    expect(serialized).not.toContain("mlsId");
    expect(serialized).not.toContain("latitude");
    expect(serialized).not.toContain("longitude");
  });

  it("separates included and excluded comparables correctly", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const withExclusions = comparables.map((c, i) => ({ ...c, included: i !== 0 }));
    const context = buildInvestmentAnalysisContext(property, withExclusions, repairEstimate, assumptions, results);
    expect(context.comparables.excluded).toHaveLength(1);
    expect(context.comparables.selected).toHaveLength(withExclusions.length - 1);
  });

  it("flags a manual ARV override correctly", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const overridden = { ...assumptions, arvOverrideCents: 30_000_000 };
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, overridden, results);
    expect(context.comparables.arvManuallyOverridden).toBe(true);
    expect(context.comparables.selectedArvCents).toBe(30_000_000);
  });

  it("reports missing property fields consistently with the completeness helper", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeInsufficientInfoFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    expect(context.property.missingFields.length).toBeGreaterThan(0);
    expect(context.property.missingFields).toContain("Bedrooms");
  });

  it("marks demo/simulated data correctly in sourceAndConfidence", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const demoProperty = { ...property, source: "simulated" as const };
    const context = buildInvestmentAnalysisContext(demoProperty, comparables, repairEstimate, assumptions, results);
    expect(context.sourceAndConfidence.isDemoData).toBe(true);
  });

  it("marks real RentCast data correctly in sourceAndConfidence", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    expect(context.sourceAndConfidence.isDemoData).toBe(false);
  });

  it("detects a list-price reduction from the original list price", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const reduced = { ...property, originalListPriceCents: 32_000_000, listPriceCents: 30_000_000 };
    const context = buildInvestmentAnalysisContext(reduced, comparables, repairEstimate, assumptions, results);
    expect(context.property.listPriceReducedFromOriginal).toBe(true);
  });
});
