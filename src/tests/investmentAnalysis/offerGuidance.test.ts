import { describe, expect, it } from "vitest";
import { buildInvestmentAnalysisContext } from "@/lib/investmentAnalysis/buildContext";
import { computeOfferGuidance } from "@/lib/investmentAnalysis/offerGuidance";
import { SUGGESTED_OPENING_OFFER_DISCOUNT } from "@/config/investmentAnalysis";
import { makeDoesNotMeetTargetsFixtures, makeStrongDealFixtures } from "@/tests/investmentAnalysis/fixtures";

describe("computeOfferGuidance", () => {
  it("ties the maximum recommended offer exactly to the deterministic MAO", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const guidance = computeOfferGuidance(context);
    expect(guidance.maximumRecommendedOfferCents).toBe(results.maximumAllowableOfferCents);
    expect(guidance.existingMaoCents).toBe(results.maximumAllowableOfferCents);
  });

  it("derives the suggested opening offer as exactly the configured discount below MAO", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const guidance = computeOfferGuidance(context);
    const expected = Math.round(results.maximumAllowableOfferCents * (1 - SUGGESTED_OPENING_OFFER_DISCOUNT));
    expect(guidance.suggestedOpeningOfferCents).toBe(expected);
    expect(guidance.discountBelowMaxUsed).toBe(SUGGESTED_OPENING_OFFER_DISCOUNT);
  });

  it("never returns a negative offer even when MAO is negative", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeDoesNotMeetTargetsFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const guidance = computeOfferGuidance(context);
    expect(guidance.maximumRecommendedOfferCents).toBeGreaterThanOrEqual(0);
    expect(guidance.suggestedOpeningOfferCents).toBeGreaterThanOrEqual(0);
  });

  it("computes the difference from list price correctly when list price is available", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const guidance = computeOfferGuidance(context);
    expect(guidance.differenceFromListPriceCents).toBe(guidance.suggestedOpeningOfferCents - property.listPriceCents!);
  });

  it("returns null for the list-price difference when list price is unavailable", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const noListPrice = { ...property, listPriceCents: null };
    const context = buildInvestmentAnalysisContext(noListPrice, comparables, repairEstimate, assumptions, results);
    const guidance = computeOfferGuidance(context);
    expect(guidance.differenceFromListPriceCents).toBeNull();
  });

  it("computes the difference from the proposed contract price correctly", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const guidance = computeOfferGuidance(context);
    expect(guidance.differenceFromProposedContractCents).toBe(results.maximumAllowableOfferCents - assumptions.contractPriceCents);
  });
});
