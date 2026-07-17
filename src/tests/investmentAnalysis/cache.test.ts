import { afterEach, describe, expect, it } from "vitest";
import { cacheKey, getCached, getInFlight, trackInFlight, __resetInvestmentAnalysisCacheForTests } from "@/lib/investmentAnalysis/cache";
import type { InvestmentAnalysisResult } from "@/lib/investmentAnalysis/types";

function makeFakeResult(overrides: Partial<InvestmentAnalysisResult> = {}): InvestmentAnalysisResult {
  return {
    dealScore: { score: 50, label: "negotiation_required", labelText: "Negotiation Required", breakdown: [] },
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
    generatedAt: new Date().toISOString(),
    analysisVersion: 1,
    inputHash: "hash-1",
    ...overrides,
  };
}

describe("investment analysis cache", () => {
  afterEach(() => {
    __resetInvestmentAnalysisCacheForTests();
  });

  it("returns null for a key that was never cached", () => {
    expect(getCached(cacheKey("deal-1", "hash-1"))).toBeNull();
  });

  it("stores and retrieves a resolved result", async () => {
    const key = cacheKey("deal-1", "hash-1");
    const result = makeFakeResult();
    await trackInFlight(key, Promise.resolve(result));
    expect(getCached(key)).toEqual(result);
  });

  it("clears the in-flight entry once the promise resolves", async () => {
    const key = cacheKey("deal-1", "hash-1");
    const promise = trackInFlight(key, Promise.resolve(makeFakeResult()));
    expect(getInFlight(key)).not.toBeNull();
    await promise;
    expect(getInFlight(key)).toBeNull();
  });

  it("clears the in-flight entry even if the promise rejects, without caching a failure", async () => {
    const key = cacheKey("deal-1", "hash-1");
    const promise = trackInFlight(key, Promise.reject(new Error("boom")));
    await expect(promise).rejects.toThrow("boom");
    expect(getInFlight(key)).toBeNull();
    expect(getCached(key)).toBeNull();
  });

  it("keeps different deals with the same input hash in separate cache entries", async () => {
    const resultA = makeFakeResult({ inputHash: "shared-hash" });
    const resultB = makeFakeResult({ inputHash: "shared-hash", dealScore: { ...resultA.dealScore, score: 90 } });
    await trackInFlight(cacheKey("deal-a", "shared-hash"), Promise.resolve(resultA));
    await trackInFlight(cacheKey("deal-b", "shared-hash"), Promise.resolve(resultB));
    expect(getCached(cacheKey("deal-a", "shared-hash"))?.dealScore.score).toBe(50);
    expect(getCached(cacheKey("deal-b", "shared-hash"))?.dealScore.score).toBe(90);
  });

  it("a concurrent request for the same key shares the same in-flight promise", () => {
    const key = cacheKey("deal-1", "hash-1");
    let resolveFn: (value: InvestmentAnalysisResult) => void;
    const pending = new Promise<InvestmentAnalysisResult>((resolve) => {
      resolveFn = resolve;
    });
    const tracked = trackInFlight(key, pending);
    const second = getInFlight(key);
    expect(second).toBe(tracked);
    resolveFn!(makeFakeResult());
  });
});
