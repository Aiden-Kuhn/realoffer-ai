import type { PropertyRecord } from "@/lib/property/types";

/**
 * Whether a property has enough core data to support a meaningful deal
 * classification. Used to trigger the "Insufficient Information" status
 * rather than guessing.
 */
export function hasSufficientPropertyInfo(property: PropertyRecord): boolean {
  return (
    property.squareFootage !== null &&
    property.bedrooms !== null &&
    property.bathrooms !== null &&
    property.yearBuilt !== null &&
    property.arvExpectedCents > 0
  );
}

export function missingPropertyFields(property: PropertyRecord): string[] {
  const missing: string[] = [];
  if (property.squareFootage === null) missing.push("Square footage");
  if (property.bedrooms === null) missing.push("Bedrooms");
  if (property.bathrooms === null) missing.push("Bathrooms");
  if (property.yearBuilt === null) missing.push("Year built");
  if (property.listPriceCents === null) missing.push("List price");
  if (property.daysOnMarket === null) missing.push("Days on market");
  return missing;
}
