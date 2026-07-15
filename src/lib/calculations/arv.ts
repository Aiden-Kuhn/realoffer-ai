import type { ComparableSale } from "@/lib/property/types";

export type ArvSuggestion = {
  lowCents: number;
  expectedCents: number;
  highCents: number;
};

/**
 * Weighted (by similarity score) average sale price of the included
 * comparables, with a +/-6% band for the low/high range. Falls back to the
 * provided default when no comparables are included.
 */
export function suggestArvFromComparables(
  comparables: ComparableSale[],
  fallback: ArvSuggestion,
): ArvSuggestion {
  const included = comparables.filter((c) => c.included);
  if (included.length === 0) return fallback;

  const totalWeight = included.reduce((sum, c) => sum + c.similarityScore, 0);
  if (totalWeight <= 0) return fallback;

  const weightedAverage = included.reduce((sum, c) => sum + c.salePriceCents * c.similarityScore, 0) / totalWeight;
  const expectedCents = Math.round(weightedAverage);

  return {
    lowCents: Math.round(expectedCents * 0.94),
    expectedCents,
    highCents: Math.round(expectedCents * 1.06),
  };
}
