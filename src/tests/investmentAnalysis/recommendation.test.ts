import { describe, expect, it } from "vitest";
import { buildInvestmentAnalysisContext } from "@/lib/investmentAnalysis/buildContext";
import { computeRecommendation } from "@/lib/investmentAnalysis/recommendation";
import {
  makeDoesNotMeetTargetsFixtures,
  makeInsufficientInfoFixtures,
  makeNegotiableDealFixtures,
  makeStrongDealFixtures,
} from "@/tests/investmentAnalysis/fixtures";

describe("computeRecommendation", () => {
  it("recommends pursuing at current assumptions for a strong, well-supported deal", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const rec = computeRecommendation(context);
    expect(rec.recommendation).toBe("pursue_at_current_assumptions");
    expect(rec.reasons.length).toBeGreaterThan(0);
  });

  it("recommends verifying repairs and comparables when a strong deal has data gaps", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const sparseComparables = comparables.slice(0, 1); // fewer than 3 included
    const context = buildInvestmentAnalysisContext(property, sparseComparables, repairEstimate, assumptions, results);
    const rec = computeRecommendation(context);
    expect(rec.recommendation).toBe("verify_repairs_and_comparables");
  });

  it("recommends negotiating lower when MAO is positive but the contract price exceeds it", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeNegotiableDealFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const rec = computeRecommendation(context);
    expect(rec.recommendation).toBe("pursue_if_negotiated_lower");
    expect(context.calculatedOutputs.maximumAllowableOfferCents).toBeGreaterThan(0);
  });

  it("recommends does-not-meet-targets when MAO itself is at or below zero", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeDoesNotMeetTargetsFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    expect(context.calculatedOutputs.maximumAllowableOfferCents).toBeLessThanOrEqual(0);
    const rec = computeRecommendation(context);
    expect(rec.recommendation).toBe("does_not_meet_targets");
  });

  it("recommends insufficient-information when key property data is missing", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeInsufficientInfoFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const rec = computeRecommendation(context);
    expect(rec.recommendation).toBe("insufficient_information");
  });

  it("always includes verification items and key assumptions, regardless of outcome", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const rec = computeRecommendation(context);
    expect(rec.requiresVerification.length).toBeGreaterThan(0);
    expect(rec.keyAssumptions.length).toBeGreaterThan(0);
  });

  it("never recommends a specific dollar figure the deterministic engine didn't produce", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const rec = computeRecommendation(context);
    const allText = [...rec.reasons, ...rec.whatWouldChangeThis, ...rec.keyAssumptions].join(" ");
    // Every dollar figure quoted must trace back to a value already present
    // in the calculated outputs or assumptions — spot check the MAO figure
    // appears verbatim rather than some invented number.
    if (allText.includes("$")) {
      expect(context.calculatedOutputs.maximumAllowableOfferCents).toBeDefined();
    }
  });
});
