import { describe, expect, it } from "vitest";
import { deriveDealInsights } from "@/lib/investmentAnalysis/deriveDealInsights";
import { computeAnalysisInputHash } from "@/lib/investmentAnalysis/inputHash";
import { makeStrongDealFixtures } from "@/tests/investmentAnalysis/fixtures";
import type { Deal } from "@/types/deal";
import type { InvestmentAnalysisResult } from "@/lib/investmentAnalysis/types";

function makeDeal(overrides: Partial<Deal> = {}): Deal {
  const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
  return {
    id: "deal-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    status: "draft",
    notes: "",
    property,
    comparables,
    assumptions,
    repairEstimate,
    results,
    dataMode: "real",
    ...overrides,
  };
}

function makeAnalysisResult(inputHash: string): InvestmentAnalysisResult {
  return {
    dealScore: { score: 80, label: "worth_investigating", labelText: "Worth Investigating", breakdown: [] },
    recommendation: {
      recommendation: "pursue_at_current_assumptions",
      recommendationLabel: "test",
      reasons: [],
      keyAssumptions: [],
      whatWouldChangeThis: [],
      requiresVerification: [],
    },
    offerGuidance: {
      suggestedOpeningOfferCents: 0,
      maximumRecommendedOfferCents: 0,
      existingMaoCents: 0,
      differenceFromListPriceCents: null,
      differenceFromProposedContractCents: 0,
      discountBelowMaxUsed: 0.06,
    },
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
    inputHash,
  };
}

describe("deriveDealInsights", () => {
  it("computes a deal score and recommendation even when the deal has never had an analysis generated", () => {
    const deal = makeDeal();
    const insights = deriveDealInsights(deal);
    expect(insights.hasAnalysis).toBe(false);
    expect(insights.isStale).toBe(false);
    expect(insights.dealScore.score).toBeGreaterThanOrEqual(0);
    expect(insights.recommendation.recommendation).toBeDefined();
  });

  it("is not stale when the saved analysis's input hash matches the deal's current inputs", () => {
    const deal = makeDeal();
    const hash = computeAnalysisInputHash(deal.property, deal.comparables, deal.repairEstimate, deal.assumptions);
    const dealWithAnalysis = { ...deal, investmentAnalysis: makeAnalysisResult(hash) };
    const insights = deriveDealInsights(dealWithAnalysis);
    expect(insights.hasAnalysis).toBe(true);
    expect(insights.isStale).toBe(false);
  });

  it("is stale when assumptions changed after the analysis was generated", () => {
    const deal = makeDeal();
    const staleHash = computeAnalysisInputHash(deal.property, deal.comparables, deal.repairEstimate, deal.assumptions);
    const changedDeal = { ...deal, assumptions: { ...deal.assumptions, contractPriceCents: deal.assumptions.contractPriceCents + 500_000 } };
    const dealWithStaleAnalysis = { ...changedDeal, investmentAnalysis: makeAnalysisResult(staleHash) };
    const insights = deriveDealInsights(dealWithStaleAnalysis);
    expect(insights.hasAnalysis).toBe(true);
    expect(insights.isStale).toBe(true);
  });

  it("does not throw and treats a corrupted `investmentAnalysis: null` as no analysis", () => {
    const deal = makeDeal();
    // `null` is distinct from `undefined` and, before this was fixed, a
    // `!== undefined` check treated it as a real analysis and then crashed
    // reading `.inputHash` off it — this can happen via hand-edited or
    // corrupted localStorage. Cast bypasses the type (which forbids null),
    // matching the untyped shape actually read back from JSON.parse.
    const corrupted = { ...deal, investmentAnalysis: null } as unknown as Parameters<typeof deriveDealInsights>[0];
    expect(() => deriveDealInsights(corrupted)).not.toThrow();
    const insights = deriveDealInsights(corrupted);
    expect(insights.hasAnalysis).toBe(false);
    expect(insights.isStale).toBe(false);
  });
});
