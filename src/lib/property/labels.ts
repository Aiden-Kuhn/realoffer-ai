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
