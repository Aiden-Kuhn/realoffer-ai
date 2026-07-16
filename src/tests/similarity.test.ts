import { describe, expect, it } from "vitest";
import { calculateRealOfferSimilarityScore } from "@/lib/property/similarity";

const baseInputs = {
  distanceMiles: 0,
  subjectSquareFootage: 1800,
  compSquareFootage: 1800,
  subjectBedrooms: 3,
  compBedrooms: 3,
  subjectBathrooms: 2,
  compBathrooms: 2,
  daysOld: 0,
  subjectPropertyType: "single_family",
  compPropertyType: "single_family",
};

describe("calculateRealOfferSimilarityScore", () => {
  it("returns 100 for an identical, adjacent, same-day comp", () => {
    expect(calculateRealOfferSimilarityScore(baseInputs)).toBe(100);
  });

  it("decreases as distance increases", () => {
    const near = calculateRealOfferSimilarityScore({ ...baseInputs, distanceMiles: 0.5 });
    const far = calculateRealOfferSimilarityScore({ ...baseInputs, distanceMiles: 5 });
    expect(near).toBeGreaterThan(far);
  });

  it("decreases as square footage difference increases", () => {
    const close = calculateRealOfferSimilarityScore({ ...baseInputs, compSquareFootage: 1850 });
    const far = calculateRealOfferSimilarityScore({ ...baseInputs, compSquareFootage: 3000 });
    expect(close).toBeGreaterThan(far);
  });

  it("penalizes bedroom and bathroom count mismatches", () => {
    const matched = calculateRealOfferSimilarityScore(baseInputs);
    const mismatched = calculateRealOfferSimilarityScore({ ...baseInputs, compBedrooms: 5, compBathrooms: 4 });
    expect(matched).toBeGreaterThan(mismatched);
  });

  it("penalizes an older/stale comp", () => {
    const fresh = calculateRealOfferSimilarityScore({ ...baseInputs, daysOld: 5 });
    const stale = calculateRealOfferSimilarityScore({ ...baseInputs, daysOld: 400 });
    expect(fresh).toBeGreaterThan(stale);
  });

  it("penalizes a property-type mismatch", () => {
    const matched = calculateRealOfferSimilarityScore(baseInputs);
    const mismatched = calculateRealOfferSimilarityScore({ ...baseInputs, compPropertyType: "condo" });
    expect(matched).toBeGreaterThan(mismatched);
  });

  it("always stays within 0-100", () => {
    const worst = calculateRealOfferSimilarityScore({
      distanceMiles: 50,
      subjectSquareFootage: 1000,
      compSquareFootage: 10000,
      subjectBedrooms: 1,
      compBedrooms: 10,
      subjectBathrooms: 1,
      compBathrooms: 10,
      daysOld: 5000,
      subjectPropertyType: "single_family",
      compPropertyType: "land",
    });
    expect(worst).toBeGreaterThanOrEqual(0);
    expect(worst).toBeLessThanOrEqual(100);
  });

  it("treats missing subject bedrooms/bathrooms/recency as a neutral 0.5 sub-score rather than crashing", () => {
    expect(() =>
      calculateRealOfferSimilarityScore({ ...baseInputs, subjectBedrooms: null, subjectBathrooms: null, daysOld: null }),
    ).not.toThrow();
  });
});
