export type PropertyType =
  | "single_family"
  | "condo"
  | "townhouse"
  | "multi_family"
  | "manufactured"
  | "land";

export type NormalizedAddress = {
  line1: string;
  city: string;
  state: string;
  zip: string;
  /** Canonical "123 MAIN ST, CITY, ST 12345" form, used as the stable hash key. */
  formatted: string;
};

export type ComparableSale = {
  id: string;
  address: string;
  salePriceCents: number;
  saleDate: string;
  distanceMiles: number;
  squareFootage: number;
  pricePerSqftCents: number;
  bedrooms: number;
  bathrooms: number;
  similarityScore: number;
  source: "simulated";
  included: boolean;
};

export type PropertyDataConfidence = "high" | "medium" | "low";

export type PropertyProfile = "strong" | "borderline" | "weak" | "incomplete";

export type PropertyRecord = {
  address: NormalizedAddress;
  listPriceCents: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFootage: number | null;
  lotSizeSqft: number | null;
  yearBuilt: number | null;
  propertyType: PropertyType;
  daysOnMarket: number | null;
  description: string;
  source: "simulated";
  confidence: PropertyDataConfidence;
  lastUpdated: string;
  arvLowCents: number;
  arvExpectedCents: number;
  arvHighCents: number;
  suggestedRepairCostCents: number;
  comparables: ComparableSale[];
  profile: PropertyProfile;
};

export interface PropertyDataProvider {
  getPropertyByAddress(address: NormalizedAddress): Promise<PropertyRecord>;
}
