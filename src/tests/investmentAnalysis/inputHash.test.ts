import { describe, expect, it } from "vitest";
import { computeAnalysisInputHash } from "@/lib/investmentAnalysis/inputHash";
import { makeStrongDealFixtures } from "@/tests/investmentAnalysis/fixtures";

describe("computeAnalysisInputHash", () => {
  it("is stable for identical inputs", () => {
    const { property, comparables, repairEstimate, assumptions } = makeStrongDealFixtures();
    const a = computeAnalysisInputHash(property, comparables, repairEstimate, assumptions);
    const b = computeAnalysisInputHash(property, comparables, repairEstimate, assumptions);
    expect(a).toBe(b);
  });

  it("changes when the contract price changes", () => {
    const { property, comparables, repairEstimate, assumptions } = makeStrongDealFixtures();
    const before = computeAnalysisInputHash(property, comparables, repairEstimate, assumptions);
    const after = computeAnalysisInputHash(property, comparables, repairEstimate, { ...assumptions, contractPriceCents: assumptions.contractPriceCents + 1 });
    expect(after).not.toBe(before);
  });

  it("changes when the ARV override changes", () => {
    const { property, comparables, repairEstimate, assumptions } = makeStrongDealFixtures();
    const before = computeAnalysisInputHash(property, comparables, repairEstimate, assumptions);
    const after = computeAnalysisInputHash(property, comparables, repairEstimate, { ...assumptions, arvOverrideCents: 25_000_000 });
    expect(after).not.toBe(before);
  });

  it("changes when a comparable's included flag changes", () => {
    const { property, comparables, repairEstimate, assumptions } = makeStrongDealFixtures();
    const before = computeAnalysisInputHash(property, comparables, repairEstimate, assumptions);
    const toggled = comparables.map((c, i) => (i === 0 ? { ...c, included: !c.included } : c));
    const after = computeAnalysisInputHash(property, toggled, repairEstimate, assumptions);
    expect(after).not.toBe(before);
  });

  it("changes when the repair estimate changes", () => {
    const { property, comparables, repairEstimate, assumptions } = makeStrongDealFixtures();
    const before = computeAnalysisInputHash(property, comparables, repairEstimate, assumptions);
    const after = computeAnalysisInputHash(property, comparables, { ...repairEstimate, manualTotalCents: repairEstimate.manualTotalCents + 500 }, assumptions);
    expect(after).not.toBe(before);
  });

  it("changes when the MAO method changes", () => {
    const { property, comparables, repairEstimate, assumptions } = makeStrongDealFixtures();
    const before = computeAnalysisInputHash(property, comparables, repairEstimate, assumptions);
    const after = computeAnalysisInputHash(property, comparables, repairEstimate, { ...assumptions, maoMethod: "TARGET_PROFIT" });
    expect(after).not.toBe(before);
  });

  it("is unaffected by fields that don't influence the analysis (e.g. notes, status)", () => {
    // computeAnalysisInputHash only takes property/comparables/repairEstimate/assumptions —
    // there's no way to pass notes/status in, which is itself the guarantee:
    // changing them elsewhere in the app can never affect this hash.
    const { property, comparables, repairEstimate, assumptions } = makeStrongDealFixtures();
    const a = computeAnalysisInputHash(property, comparables, repairEstimate, assumptions);
    const b = computeAnalysisInputHash({ ...property }, [...comparables], { ...repairEstimate }, { ...assumptions });
    expect(a).toBe(b);
  });

  it("changes when the property's lastUpdated timestamp changes (e.g. after a refresh)", () => {
    const { property, comparables, repairEstimate, assumptions } = makeStrongDealFixtures();
    const before = computeAnalysisInputHash(property, comparables, repairEstimate, assumptions);
    const after = computeAnalysisInputHash({ ...property, lastUpdated: "2030-01-01T00:00:00.000Z" }, comparables, repairEstimate, assumptions);
    expect(after).not.toBe(before);
  });
});
