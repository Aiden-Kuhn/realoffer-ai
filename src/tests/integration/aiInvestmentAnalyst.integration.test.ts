import { describe, expect, it } from "vitest";
import { buildInvestmentAnalysisContext } from "@/lib/investmentAnalysis/buildContext";
import { computeDealScore } from "@/lib/investmentAnalysis/dealScore";
import { computeRecommendation } from "@/lib/investmentAnalysis/recommendation";
import { computeOfferGuidance } from "@/lib/investmentAnalysis/offerGuidance";
import { computeSensitivityAnalysis } from "@/lib/investmentAnalysis/sensitivity";
import { AIInvestmentAnalysisProvider } from "@/lib/investmentAnalysis/aiProvider";
import { aiNarrativeSchema } from "@/lib/investmentAnalysis/types";
import { makeStrongDealFixtures } from "@/tests/investmentAnalysis/fixtures";

/**
 * Optional, real-network integration test. Skipped entirely unless both
 * AI_PROVIDER and AI_API_KEY are present in the environment — never runs
 * as part of `npm run test`, and never runs in CI unless those variables
 * are deliberately provided. Run with: npm run test:integration
 *
 * Makes exactly one live AI request (no retry loop) against a small,
 * fixed, non-sensitive fixture. Never commit a real API key anywhere in
 * this repo.
 */
const hasAiConfig = Boolean(process.env.AI_PROVIDER) && Boolean(process.env.AI_API_KEY);

describe.skipIf(!hasAiConfig)("AI Investment Analyst live integration", () => {
  it(
    "generates a schema-valid narrative from a single real AI request",
    async () => {
      const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
      const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
      const dealScore = computeDealScore(context);
      const recommendation = computeRecommendation(context);
      const offerGuidance = computeOfferGuidance(context);
      const sensitivity = computeSensitivityAnalysis(context);

      const provider = new AIInvestmentAnalysisProvider();
      const result = await provider.generate({
        context,
        dealScore,
        recommendation,
        offerGuidance,
        sensitivity,
        inputHash: "integration-test-hash",
      });

      expect(result.source).toBe("ai");
      expect(() => aiNarrativeSchema.parse(result.narrative)).not.toThrow();
      // The deterministic values must pass through completely unchanged.
      expect(result.dealScore).toEqual(dealScore);
      expect(result.offerGuidance).toEqual(offerGuidance);
    },
    30_000,
  );
});
