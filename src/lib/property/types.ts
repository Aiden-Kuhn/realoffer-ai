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
  /** Canonical "123 MAIN ST, CITY, ST 12345" form, used as the stable hash/cache key. */
  formatted: string;
};

/** Where a record's data actually came from. */
export type PropertyDataSource = "rentcast" | "simulated";

export type ComparableSaleType = "sold" | "active_listing" | "unknown";
export type SimilarityScoreSource = "provider" | "calculated";

export type ComparableSale = {
  id: string;
  address: string;
  salePriceCents: number;
  saleDate: string;
  distanceMiles: number;
  squareFootage: number;
  pricePerSqftCents: number;
  /** Null when the provider didn't report this for the comp — never a
   * fabricated 0 or a value borrowed from the subject property. */
  bedrooms: number | null;
  bathrooms: number | null;
  similarityScore: number;
  /** Whether the score above came from RentCast's own correlation figure or our documented fallback formula. */
  similaritySource: SimilarityScoreSource;
  /**
   * RentCast's comps aren't guaranteed closed sales — this reflects the
   * listing status RentCast actually reported, not an assumption.
   */
  saleType: ComparableSaleType;
  source: PropertyDataSource;
  /** RentCast's property id for this comp, when available. */
  providerId: string | null;
  included: boolean;
};

export type PropertyDataConfidence = "high" | "medium" | "low";

/** Demo-only profile bucket used to drive the mock generator's variety. Absent for real records. */
export type PropertyProfile = "strong" | "borderline" | "weak" | "incomplete";

export type PropertyRecord = {
  address: NormalizedAddress;

  // Property-record facts (RentCast /v1/properties, or generated for demo).
  // bedrooms/bathrooms/squareFootage fall back to the active listing
  // (/v1/listings/sale) when the public-record source is missing them —
  // see applyListing() in rentcast/normalize.ts.
  bedrooms: number | null;
  bathrooms: number | null;
  squareFootage: number | null;
  lotSizeSqft: number | null;
  yearBuilt: number | null;
  propertyType: PropertyType;
  county: string | null;
  latitude: number | null;
  longitude: number | null;
  lastSaleDate: string | null;
  lastSalePriceCents: number | null;
  taxAssessedValueCents: number | null;
  annualPropertyTaxCents: number | null;
  providerRecordId: string | null;

  // Active sale listing facts (RentCast /v1/listings/sale). All null when no listing was found.
  listPriceCents: number | null;
  originalListPriceCents: number | null;
  listingStatus: string | null;
  listedDate: string | null;
  daysOnMarket: number | null;
  mlsId: string | null;
  hoaFeeCents: number | null;
  propertySubtype: string | null;
  description: string;

  // Automated valuation (RentCast /v1/avm/value). This is RentCast's current
  // estimated market value — it is NOT the same thing as ARV. See arvLowCents
  // et al below, which are a RealOffer-calculated suggestion from comparables.
  currentValueCents: number | null;
  valuationRangeLowCents: number | null;
  valuationRangeHighCents: number | null;
  valuationDate: string | null;

  // RealOffer-calculated baseline ARV suggestion, derived from comparables
  // (see lib/calculations/arv.ts). Never RentCast's AVM value directly.
  arvLowCents: number;
  arvExpectedCents: number;
  arvHighCents: number;
  suggestedRepairCostCents: number;

  comparables: ComparableSale[];

  source: PropertyDataSource;
  confidence: PropertyDataConfidence;
  lastUpdated: string;
  /** Demo-only bucket; undefined/absent for real RentCast records. */
  profile?: PropertyProfile;
};

// ---------------------------------------------------------------------------
// Provider result / error types
// ---------------------------------------------------------------------------

export type ProviderErrorCode =
  | "missing_api_key"
  | "invalid_api_key"
  | "rate_limited"
  | "quota_exceeded"
  | "timeout"
  | "network_error"
  | "not_found"
  | "malformed_response"
  | "unsupported_property_type"
  | "unknown";

/** User-safe error — never include the API key, a raw stack trace, or the full upstream payload. */
export type ProviderError = {
  code: ProviderErrorCode;
  message: string;
};

export type AddressMatchCandidate = {
  providerId: string;
  formattedAddress: string;
};

export type PropertyDataResult =
  | { status: "ok"; property: PropertyRecord }
  | { status: "ambiguous"; candidates: AddressMatchCandidate[] }
  | { status: "error"; error: ProviderError };

export interface PropertyDataProvider {
  getPropertyByAddress(address: NormalizedAddress, options?: { forceRefresh?: boolean }): Promise<PropertyDataResult>;
}
