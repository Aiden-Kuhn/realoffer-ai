import type { PropertyRecord } from "@/lib/property/types";

export const PROPERTY_TYPE_LABELS: Record<PropertyRecord["propertyType"], string> = {
  single_family: "Single Family",
  condo: "Condo",
  townhouse: "Townhouse",
  multi_family: "Multi-Family",
  manufactured: "Manufactured",
  land: "Land",
};

export const CONFIDENCE_LABELS: Record<PropertyRecord["confidence"], string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

/** Compact "3 bd · 2 ba" summary for list/card views. Omits whichever side
 * is null rather than showing a fabricated 0, and returns null entirely
 * when both are unknown so callers can skip rendering it. */
export function formatBedsBaths(bedrooms: number | null, bathrooms: number | null): string | null {
  const parts: string[] = [];
  if (bedrooms !== null) parts.push(`${bedrooms} bd`);
  if (bathrooms !== null) parts.push(`${bathrooms} ba`);
  return parts.length > 0 ? parts.join(" · ") : null;
}
