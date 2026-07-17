import { describe, expect, it } from "vitest";
import { buildInvestmentAnalysisContext } from "@/lib/investmentAnalysis/buildContext";
import { computeDealScore } from "@/lib/investmentAnalysis/dealScore";
import { INSUFFICIENT_INFO_SCORE_CAP } from "@/config/investmentAnalysis";
import {
  makeDoesNotMeetTargetsFixtures,
  makeInsufficientInfoFixtures,
  makeStrongDealFixtures,
} from "@/tests/investmentAnalysis/fixtures";

describe("computeDealScore", () => {
  it("scores a strong deal in the 0-100 range and never above 100", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const score = computeDealScore(context);
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
    expect(score.label).toBe("strong_candidate");
  });

  it("scores a deal with negative cushion and profit low", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeDoesNotMeetTargetsFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const score = computeDealScore(context);
    expect(score.score).toBeLessThan(50);
  });

  it("caps the score for insufficient-information deals regardless of raw component math", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeInsufficientInfoFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    // The cap is driven off the raw enum key, not a substring match on the
    // display label — assert the key directly so a future regression back
    // to label-matching would be caught here.
    expect(context.calculatedOutputs.dealClassificationKey).toBe("insufficient_information");
    const score = computeDealScore(context);
    expect(score.score).toBeLessThanOrEqual(INSUFFICIENT_INFO_SCORE_CAP);
    expect(score.label).toBe("does_not_meet_targets");
  });

  it("never returns a negative score", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeDoesNotMeetTargetsFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const score = computeDealScore(context);
    expect(score.score).toBeGreaterThanOrEqual(0);
  });

  it("produces a breakdown whose points sum to the total score", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const score = computeDealScore(context);
    const sum = score.breakdown.reduce((total, item) => total + item.pointsEarned, 0);
    // Score may be clamped/capped below the raw sum (e.g. insufficient-info
    // cap), but for an uncapped strong deal it should match exactly.
    expect(sum).toBe(score.score);
  });

  it("every breakdown item's earned points never exceed its possible points", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const score = computeDealScore(context);
    for (const item of score.breakdown) {
      expect(item.pointsEarned).toBeLessThanOrEqual(item.pointsPossible);
      expect(item.pointsEarned).toBeGreaterThanOrEqual(0);
    }
  });

  it("is a pure function of its context — same input produces the same score", () => {
    const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    const first = computeDealScore(context);
    const second = computeDealScore(context);
    expect(first).toEqual(second);
  });
});
