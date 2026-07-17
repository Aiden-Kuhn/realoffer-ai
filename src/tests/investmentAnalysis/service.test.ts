import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeStrongDealFixtures } from "@/tests/investmentAnalysis/fixtures";

const originalEnv = { ...process.env };

async function importFreshService() {
  vi.resetModules();
  return import("@/lib/investmentAnalysis/service");
}

describe("generateInvestmentAnalysis (service)", () => {
  beforeEach(() => {
    delete process.env.AI_PROVIDER;
    delete process.env.AI_API_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("falls back to the rule-based provider when no AI provider is configured", async () => {
    const { generateInvestmentAnalysis } = await importFreshService();
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const { result, origin } = await generateInvestmentAnalysis("deal-1", property, comparables, repairEstimate, assumptions, results);
    expect(result.source).toBe("rule_based");
    expect(origin).toBe("rule_based");
  });

  it("the application remains usable (never throws) with no AI key configured", async () => {
    const { generateInvestmentAnalysis } = await importFreshService();
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    await expect(
      generateInvestmentAnalysis("deal-1", property, comparables, repairEstimate, assumptions, results),
    ).resolves.toBeDefined();
  });

  it("reuses a cached result for identical inputs instead of regenerating", async () => {
    const { generateInvestmentAnalysis } = await importFreshService();
    const { RuleBasedInvestmentAnalysisProvider } = await import("@/lib/investmentAnalysis/ruleBasedProvider");
    const generateSpy = vi.spyOn(RuleBasedInvestmentAnalysisProvider.prototype, "generate");

    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const first = await generateInvestmentAnalysis("deal-1", property, comparables, repairEstimate, assumptions, results);
    const second = await generateInvestmentAnalysis("deal-1", property, comparables, repairEstimate, assumptions, results);

    expect(generateSpy).toHaveBeenCalledTimes(1);
    expect(second.origin).toBe("cache");
    expect(second.result.generatedAt).toBe(first.result.generatedAt);
  });

  it("does not reuse the cache when a different deal has the same assumptions", async () => {
    const { generateInvestmentAnalysis } = await importFreshService();
    const { RuleBasedInvestmentAnalysisProvider } = await import("@/lib/investmentAnalysis/ruleBasedProvider");
    const generateSpy = vi.spyOn(RuleBasedInvestmentAnalysisProvider.prototype, "generate");

    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    await generateInvestmentAnalysis("deal-1", property, comparables, repairEstimate, assumptions, results);
    await generateInvestmentAnalysis("deal-2", property, comparables, repairEstimate, assumptions, results);

    expect(generateSpy).toHaveBeenCalledTimes(2);
  });

  it("regenerates when assumptions change (different input hash)", async () => {
    const { generateInvestmentAnalysis } = await importFreshService();
    const { RuleBasedInvestmentAnalysisProvider } = await import("@/lib/investmentAnalysis/ruleBasedProvider");
    const generateSpy = vi.spyOn(RuleBasedInvestmentAnalysisProvider.prototype, "generate");

    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    await generateInvestmentAnalysis("deal-1", property, comparables, repairEstimate, assumptions, results);
    const changedAssumptions = { ...assumptions, contractPriceCents: assumptions.contractPriceCents + 100_000 };
    await generateInvestmentAnalysis("deal-1", property, comparables, repairEstimate, changedAssumptions, results);

    expect(generateSpy).toHaveBeenCalledTimes(2);
  });

  it("forceRegenerate bypasses the cache even for identical inputs", async () => {
    const { generateInvestmentAnalysis } = await importFreshService();
    const { RuleBasedInvestmentAnalysisProvider } = await import("@/lib/investmentAnalysis/ruleBasedProvider");
    const generateSpy = vi.spyOn(RuleBasedInvestmentAnalysisProvider.prototype, "generate");

    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    await generateInvestmentAnalysis("deal-1", property, comparables, repairEstimate, assumptions, results);
    await generateInvestmentAnalysis("deal-1", property, comparables, repairEstimate, assumptions, results, { forceRegenerate: true });

    expect(generateSpy).toHaveBeenCalledTimes(2);
  });

  it("dedupes concurrent requests for the same deal and inputs into a single generation", async () => {
    const { generateInvestmentAnalysis } = await importFreshService();
    const { RuleBasedInvestmentAnalysisProvider } = await import("@/lib/investmentAnalysis/ruleBasedProvider");
    const generateSpy = vi.spyOn(RuleBasedInvestmentAnalysisProvider.prototype, "generate");

    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const [a, b] = await Promise.all([
      generateInvestmentAnalysis("deal-1", property, comparables, repairEstimate, assumptions, results),
      generateInvestmentAnalysis("deal-1", property, comparables, repairEstimate, assumptions, results),
    ]);

    expect(generateSpy).toHaveBeenCalledTimes(1);
    expect(a.result.generatedAt).toBe(b.result.generatedAt);
  });

  it("falls back to the rule-based provider when the AI provider throws", async () => {
    process.env.AI_PROVIDER = "anthropic";
    process.env.AI_API_KEY = "test-key";

    vi.doMock("@/lib/investmentAnalysis/aiClient", async () => {
      const actual = await vi.importActual<typeof import("@/lib/investmentAnalysis/aiClient")>("@/lib/investmentAnalysis/aiClient");
      return { ...actual, callAiInvestmentAnalyst: vi.fn().mockRejectedValue(new actual.AiProviderError("rate_limited", "rate limited")) };
    });

    const { generateInvestmentAnalysis } = await importFreshService();
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const { result, origin } = await generateInvestmentAnalysis("deal-1", property, comparables, repairEstimate, assumptions, results);

    expect(result.source).toBe("rule_based");
    expect(origin).toBe("rule_based");
    vi.doUnmock("@/lib/investmentAnalysis/aiClient");
  });

  it("reports whether AI analysis is enabled via isInvestmentAnalystAiEnabled", async () => {
    const { isInvestmentAnalystAiEnabled } = await importFreshService();
    await expect(isInvestmentAnalystAiEnabled()).resolves.toBe(false);

    process.env.AI_PROVIDER = "anthropic";
    process.env.AI_API_KEY = "test-key";
    const { isInvestmentAnalystAiEnabled: enabledAfter } = await importFreshService();
    await expect(enabledAfter()).resolves.toBe(true);
  });
});
