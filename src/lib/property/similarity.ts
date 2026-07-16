/**
 * RealOffer similarity score — used only as a fallback when a provider does
 * not supply its own similarity/correlation figure for a comparable. Never
 * presented as a provider-verified figure; always labeled "RealOffer score."
 *
 * Documented formula: a weighted average of five 0-1 sub-scores, each
 * degrading linearly to 0 past a reasonable threshold, combined as a
 * percentage (0-100, rounded):
 *
 *   distance      25% — 1.0 at 0 miles, 0.0 at >= 3 miles
 *   sqft delta    25% — 1.0 at 0% difference, 0.0 at >= 30% difference
 *   bedroom delta 10% — 1.0 at 0 beds difference, 0.0 at >= 3 beds difference
 *   bathroom delta 10% — 1.0 at 0 baths difference, 0.0 at >= 3 baths difference
 *   recency       15% — 1.0 today, 0.0 at >= 365 days old
 *   type match    15% — 1.0 if property type matches the subject, else 0.5
 */

export type SimilarityInputs = {
  distanceMiles: number;
  subjectSquareFootage: number;
  compSquareFootage: number;
  subjectBedrooms: number | null;
  compBedrooms: number;
  subjectBathrooms: number | null;
  compBathrooms: number;
  daysOld: number | null;
  subjectPropertyType: string;
  compPropertyType: string;
};

function linearDecay(value: number, zeroAt: number): number {
  if (zeroAt <= 0) return 0;
  return Math.max(0, 1 - value / zeroAt);
}

export function calculateRealOfferSimilarityScore(inputs: SimilarityInputs): number {
  const distanceScore = linearDecay(inputs.distanceMiles, 3);

  const sqftDeltaPct =
    inputs.subjectSquareFootage > 0
      ? Math.abs(inputs.compSquareFootage - inputs.subjectSquareFootage) / inputs.subjectSquareFootage
      : 0;
  const sqftScore = linearDecay(sqftDeltaPct, 0.3);

  const bedroomScore =
    inputs.subjectBedrooms === null ? 0.5 : linearDecay(Math.abs(inputs.compBedrooms - inputs.subjectBedrooms), 3);
  const bathroomScore =
    inputs.subjectBathrooms === null ? 0.5 : linearDecay(Math.abs(inputs.compBathrooms - inputs.subjectBathrooms), 3);

  const recencyScore = inputs.daysOld === null ? 0.5 : linearDecay(inputs.daysOld, 365);

  const typeScore = inputs.subjectPropertyType === inputs.compPropertyType ? 1 : 0.5;

  const weighted =
    distanceScore * 0.25 + sqftScore * 0.25 + bedroomScore * 0.1 + bathroomScore * 0.1 + recencyScore * 0.15 + typeScore * 0.15;

  return Math.round(Math.min(1, Math.max(0, weighted)) * 100);
}
