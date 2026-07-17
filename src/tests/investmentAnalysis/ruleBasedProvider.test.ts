import { describe, expect, it } from "vitest";
import { buildInvestmentAnalysisContext } from "@/lib/investmentAnalysis/buildContext";
import { computeDealScore } from "@/lib/investmentAnalysis/dealScore";
import { computeRecommendation } from "@/lib/investmentAnalysis/recommendation";
import { computeOfferGuidance } from "@/lib/investmentAnalysis/offerGuidance";
import { computeSensitivityAnalysis } from "@/lib/investmentAnalysis/sensitivity";
import { RuleBasedInvestmentAnalysisProvider, generateRuleBasedNarrative } from "@/lib/investmentAnalysis/ruleBasedProvider";
import { aiNarrativeSchema } from "@/lib/investmentAnalysis/types";
import { makeDoesNotMeetTargetsFixtures, makeStrongDealFixtures } from "@/tests/investmentAnalysis/fixtures";
import type { GenerateAnalysisParams } from "@/lib/investmentAnalysis/provider";

function buildParams(fixtures: ReturnType<typeof makeStrongDealFixtures>): GenerateAnalysisParams {
  const { property, comparables, repairEstimate, assumptions, results } = fixtures;
  const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
  return {
    context,
    dealScore: computeDealScore(context),
    recommendation: computeRecommendation(context),
    offerGuidance: computeOfferGuidance(context),
    sensitivity: computeSensitivityAnalysis(context),
    inputHash: "test-hash",
  };
}

describe("RuleBasedInvestmentAnalysisProvider", () => {
  it("never throws and never requires network access", async () => {
    const params = buildParams(makeStrongDealFixtures());
    const provider = new RuleBasedInvestmentAnalysisProvider();
    await expect(provider.generate(params)).resolves.toBeDefined();
  });

  it("produces output that validates against the shared AI narrative schema", async () => {
    const params = buildParams(makeStrongDealFixtures());
    const provider = new RuleBasedInvestmentAnalysisProvider();
    const result = await provider.generate(params);
    expect(() => aiNarrativeSchema.parse(result.narrative)).not.toThrow();
  });

  it("carries the deterministic score/recommendation/offer/sensitivity through unchanged", async () => {
    const params = buildParams(makeStrongDealFixtures());
    const provider = new RuleBasedInvestmentAnalysisProvider();
    const result = await provider.generate(params);
    expect(result.dealScore).toEqual(params.dealScore);
    expect(result.recommendation).toEqual(params.recommendation);
    expect(result.offerGuidance).toEqual(params.offerGuidance);
    expect(result.sensitivity).toEqual(params.sensitivity);
  });

  it("marks itself as the rule_based source with no provider/model", async () => {
    const params = buildParams(makeStrongDealFixtures());
    const provider = new RuleBasedInvestmentAnalysisProvider();
    const result = await provider.generate(params);
    expect(result.source).toBe("rule_based");
    expect(result.provider).toBeNull();
    expect(result.model).toBeNull();
  });

  it("flags negative-profit deals as a risk in the generated narrative", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeDoesNotMeetTargetsFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const dealScore = computeDealScore(context);
    const recommendation = computeRecommendation(context);
    const sensitivity = computeSensitivityAnalysis(context);
    const narrative = generateRuleBasedNarrative(context, dealScore, recommendation, sensitivity);
    expect(narrative.risks.some((r) => r.toLowerCase().includes("profit"))).toBe(true);
  });

  it("always includes at least one strength or risk entry, never an empty wall", () => {
    const params = buildParams(makeStrongDealFixtures());
    const context = params.context;
    const narrative = generateRuleBasedNarrative(context, params.dealScore, params.recommendation, params.sensitivity);
    expect(narrative.strengths.length).toBeGreaterThan(0);
    expect(narrative.risks.length).toBeGreaterThan(0);
  });
});
