import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildInvestmentAnalysisContext } from "@/lib/investmentAnalysis/buildContext";
import { computeDealScore } from "@/lib/investmentAnalysis/dealScore";
import { computeRecommendation } from "@/lib/investmentAnalysis/recommendation";
import { computeOfferGuidance } from "@/lib/investmentAnalysis/offerGuidance";
import { computeSensitivityAnalysis } from "@/lib/investmentAnalysis/sensitivity";
import { makeStrongDealFixtures } from "@/tests/investmentAnalysis/fixtures";
import type { GenerateAnalysisParams } from "@/lib/investmentAnalysis/provider";

const originalEnv = { ...process.env };

const VALID_NARRATIVE = {
  executiveSummary: "This deal appears worth investigating based on the current assumptions.",
  strengths: ["Positive buyer cushion."],
  risks: ["Repair estimate is a rough starting point."],
  missingInformation: [],
  priceAnalysis: "Contract price is below the maximum allowable offer.",
  repairAnalysis: "Repairs were estimated with a manual total.",
  arvAnalysis: "ARV is supported by five comparable sales.",
  comparableAnalysis: "Five comparables included, none excluded.",
  negotiationPoints: ["You control all offers and negotiations."],
  nextSteps: ["Verify repair scope with a walkthrough."],
  confidence: "high",
  confidenceReasons: ["Provider data confidence is high."],
  warnings: [],
};

function buildParams(): GenerateAnalysisParams {
  const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
  const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
  return {
    context,
    dealScore: computeDealScore(context),
    recommendation: computeRecommendation(context),
    offerGuidance: computeOfferGuidance(context),
    sensitivity: computeSensitivityAnalysis(context),
    inputHash: "test-hash-ai",
  };
}

async function importFreshProvider() {
  vi.resetModules();
  return import("@/lib/investmentAnalysis/aiProvider");
}

describe("AIInvestmentAnalysisProvider", () => {
  beforeEach(() => {
    process.env.AI_PROVIDER = "anthropic";
    process.env.AI_API_KEY = "test-ai-key";
    process.env.AI_MODEL = "claude-sonnet-5";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
    vi.doUnmock("@/lib/investmentAnalysis/aiClient");
  });

  it("returns a validated result when the model responds with valid JSON on the first try", async () => {
    vi.doMock("@/lib/investmentAnalysis/aiClient", async () => {
      const actual = await vi.importActual<typeof import("@/lib/investmentAnalysis/aiClient")>("@/lib/investmentAnalysis/aiClient");
      return { ...actual, callAiInvestmentAnalyst: vi.fn().mockResolvedValue(JSON.stringify(VALID_NARRATIVE)) };
    });
    const { AIInvestmentAnalysisProvider } = await importFreshProvider();
    const provider = new AIInvestmentAnalysisProvider();
    const result = await provider.generate(buildParams());
    expect(result.source).toBe("ai");
    expect(result.narrative.executiveSummary).toBe(VALID_NARRATIVE.executiveSummary);
  });

  it("strips markdown code fences before parsing", async () => {
    vi.doMock("@/lib/investmentAnalysis/aiClient", async () => {
      const actual = await vi.importActual<typeof import("@/lib/investmentAnalysis/aiClient")>("@/lib/investmentAnalysis/aiClient");
      return { ...actual, callAiInvestmentAnalyst: vi.fn().mockResolvedValue("```json\n" + JSON.stringify(VALID_NARRATIVE) + "\n```") };
    });
    const { AIInvestmentAnalysisProvider } = await importFreshProvider();
    const provider = new AIInvestmentAnalysisProvider();
    const result = await provider.generate(buildParams());
    expect(result.narrative.executiveSummary).toBe(VALID_NARRATIVE.executiveSummary);
  });

  it("attempts one repair call when the first response is invalid JSON, and succeeds if the repair is valid", async () => {
    const mockClient = vi.fn().mockResolvedValueOnce("this is not json at all").mockResolvedValueOnce(JSON.stringify(VALID_NARRATIVE));
    vi.doMock("@/lib/investmentAnalysis/aiClient", async () => {
      const actual = await vi.importActual<typeof import("@/lib/investmentAnalysis/aiClient")>("@/lib/investmentAnalysis/aiClient");
      return { ...actual, callAiInvestmentAnalyst: mockClient };
    });
    const { AIInvestmentAnalysisProvider } = await importFreshProvider();
    const provider = new AIInvestmentAnalysisProvider();
    const result = await provider.generate(buildParams());
    expect(mockClient).toHaveBeenCalledTimes(2);
    expect(result.narrative.executiveSummary).toBe(VALID_NARRATIVE.executiveSummary);
  });

  it("throws after the repair attempt also fails, without a third call", async () => {
    const mockClient = vi.fn().mockResolvedValueOnce("not json").mockResolvedValueOnce("still not json");
    vi.doMock("@/lib/investmentAnalysis/aiClient", async () => {
      const actual = await vi.importActual<typeof import("@/lib/investmentAnalysis/aiClient")>("@/lib/investmentAnalysis/aiClient");
      return { ...actual, callAiInvestmentAnalyst: mockClient };
    });
    const { AIInvestmentAnalysisProvider } = await importFreshProvider();
    const provider = new AIInvestmentAnalysisProvider();
    await expect(provider.generate(buildParams())).rejects.toMatchObject({ code: "malformed_response" });
    expect(mockClient).toHaveBeenCalledTimes(2);
  });

  it("rejects a response missing required schema fields and triggers the repair path", async () => {
    const incomplete = { executiveSummary: "Missing everything else." };
    const mockClient = vi.fn().mockResolvedValueOnce(JSON.stringify(incomplete)).mockResolvedValueOnce(JSON.stringify(VALID_NARRATIVE));
    vi.doMock("@/lib/investmentAnalysis/aiClient", async () => {
      const actual = await vi.importActual<typeof import("@/lib/investmentAnalysis/aiClient")>("@/lib/investmentAnalysis/aiClient");
      return { ...actual, callAiInvestmentAnalyst: mockClient };
    });
    const { AIInvestmentAnalysisProvider } = await importFreshProvider();
    const provider = new AIInvestmentAnalysisProvider();
    const result = await provider.generate(buildParams());
    expect(mockClient).toHaveBeenCalledTimes(2);
    expect(result.narrative.executiveSummary).toBe(VALID_NARRATIVE.executiveSummary);
  });

  it("rejects and repairs when the model returns an excessively long field", async () => {
    const tooLong = { ...VALID_NARRATIVE, executiveSummary: "x".repeat(5000) };
    const mockClient = vi.fn().mockResolvedValueOnce(JSON.stringify(tooLong)).mockResolvedValueOnce(JSON.stringify(VALID_NARRATIVE));
    vi.doMock("@/lib/investmentAnalysis/aiClient", async () => {
      const actual = await vi.importActual<typeof import("@/lib/investmentAnalysis/aiClient")>("@/lib/investmentAnalysis/aiClient");
      return { ...actual, callAiInvestmentAnalyst: mockClient };
    });
    const { AIInvestmentAnalysisProvider } = await importFreshProvider();
    const provider = new AIInvestmentAnalysisProvider();
    const result = await provider.generate(buildParams());
    expect(result.narrative.executiveSummary.length).toBeLessThan(1000);
  });

  it("passes an XSS-style string through as inert data, never executed or stripped specially", async () => {
    const withScript = { ...VALID_NARRATIVE, strengths: ["<script>alert('xss')</script>"] };
    vi.doMock("@/lib/investmentAnalysis/aiClient", async () => {
      const actual = await vi.importActual<typeof import("@/lib/investmentAnalysis/aiClient")>("@/lib/investmentAnalysis/aiClient");
      return { ...actual, callAiInvestmentAnalyst: vi.fn().mockResolvedValue(JSON.stringify(withScript)) };
    });
    const { AIInvestmentAnalysisProvider } = await importFreshProvider();
    const provider = new AIInvestmentAnalysisProvider();
    const result = await provider.generate(buildParams());
    // It's just a string in the data model — rendering safety is a UI
    // concern (no dangerouslySetInnerHTML anywhere), not a parsing concern.
    expect(result.narrative.strengths[0]).toBe("<script>alert('xss')</script>");
  });

  it("ignores any financial numbers the model tries to inject — deterministic outputs always win", async () => {
    const params = buildParams();
    const contradictory = {
      ...VALID_NARRATIVE,
      // A model attempting to "change" calculated numbers by smuggling them
      // into the JSON — these keys aren't part of aiNarrativeSchema, so zod
      // strips them, and even if it didn't, the provider never reads them.
      maximumAllowableOfferCents: 999_999_999,
      overallScore: 100,
      recommendation: "guaranteed_profit",
    };
    vi.doMock("@/lib/investmentAnalysis/aiClient", async () => {
      const actual = await vi.importActual<typeof import("@/lib/investmentAnalysis/aiClient")>("@/lib/investmentAnalysis/aiClient");
      return { ...actual, callAiInvestmentAnalyst: vi.fn().mockResolvedValue(JSON.stringify(contradictory)) };
    });
    const { AIInvestmentAnalysisProvider } = await importFreshProvider();
    const provider = new AIInvestmentAnalysisProvider();
    const result = await provider.generate(params);

    expect(result.dealScore).toEqual(params.dealScore);
    expect(result.offerGuidance).toEqual(params.offerGuidance);
    expect((result.narrative as Record<string, unknown>).maximumAllowableOfferCents).toBeUndefined();
    expect((result.narrative as Record<string, unknown>).overallScore).toBeUndefined();
  });

  it("propagates provider failure (e.g. rate limit) as a typed error rather than a raw exception", async () => {
    vi.doMock("@/lib/investmentAnalysis/aiClient", async () => {
      const actual = await vi.importActual<typeof import("@/lib/investmentAnalysis/aiClient")>("@/lib/investmentAnalysis/aiClient");
      return { ...actual, callAiInvestmentAnalyst: vi.fn().mockRejectedValue(new actual.AiProviderError("rate_limited", "Rate limited")) };
    });
    const { AIInvestmentAnalysisProvider } = await importFreshProvider();
    const provider = new AIInvestmentAnalysisProvider();
    await expect(provider.generate(buildParams())).rejects.toMatchObject({ code: "rate_limited" });
  });
});
