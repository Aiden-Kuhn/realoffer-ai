import { dollarsToCents } from "@/lib/calculations/money";
import { calculateRealOfferSimilarityScore } from "@/lib/property/similarity";
import type { ComparableSale, NormalizedAddress, PropertyDataConfidence, PropertyRecord, PropertyType } from "@/lib/property/types";
import type {
  RentCastComparable,
  RentCastPropertyRecord,
  RentCastSaleListing,
  RentCastValueEstimate,
} from "@/lib/property/rentcast/rawTypes";

const PROPERTY_TYPE_MAP: Record<string, PropertyType> = {
  "single family": "single_family",
  condo: "condo",
  condominium: "condo",
  townhouse: "townhouse",
  manufactured: "manufactured",
  "multi-family": "multi_family",
  "multi family": "multi_family",
  apartment: "multi_family",
  land: "land",
};

export function mapRentCastPropertyType(raw: string | undefined): PropertyType {
  if (!raw) return "single_family";
  return PROPERTY_TYPE_MAP[raw.trim().toLowerCase()] ?? "single_family";
}

function latestByYear<T extends { year: number }>(record: Record<string, T> | undefined): T | null {
  if (!record) return null;
  const values = Object.values(record);
  if (values.length === 0) return null;
  return values.reduce((latest, current) => (current.year > latest.year ? current : latest));
}

function toCentsOrNull(dollars: number | undefined | null): number | null {
  return typeof dollars === "number" && Number.isFinite(dollars) ? dollarsToCents(dollars) : null;
}

/** Builds the property-record portion (no listing, no valuation) — used as the base every other piece merges into. */
export function normalizePropertyRecord(raw: RentCastPropertyRecord, address: NormalizedAddress): PropertyRecord {
  const latestTaxAssessment = latestByYear(raw.taxAssessments);
  const latestPropertyTax = latestByYear(raw.propertyTaxes);

  return {
    address,
    bedrooms: raw.bedrooms ?? null,
    bathrooms: raw.bathrooms ?? null,
    squareFootage: raw.squareFootage ?? null,
    lotSizeSqft: raw.lotSize ?? null,
    yearBuilt: raw.yearBuilt ?? null,
    propertyType: mapRentCastPropertyType(raw.propertyType),
    county: raw.county ?? null,
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
    lastSaleDate: raw.lastSaleDate ?? null,
    lastSalePriceCents: toCentsOrNull(raw.lastSalePrice),
    taxAssessedValueCents: latestTaxAssessment ? dollarsToCents(latestTaxAssessment.value) : null,
    annualPropertyTaxCents: latestPropertyTax ? dollarsToCents(latestPropertyTax.total) : null,
    providerRecordId: raw.id ?? null,

    listPriceCents: null,
    originalListPriceCents: null,
    listingStatus: null,
    listedDate: null,
    daysOnMarket: null,
    mlsId: null,
    hoaFeeCents: null,
    propertySubtype: null,
    description: buildFallbackDescription(raw),

    currentValueCents: null,
    valuationRangeLowCents: null,
    valuationRangeHighCents: null,
    valuationDate: null,

    arvLowCents: 0,
    arvExpectedCents: 0,
    arvHighCents: 0,
    suggestedRepairCostCents: 0,

    comparables: [],
    source: "rentcast",
    confidence: "medium",
    lastUpdated: new Date().toISOString(),
  };
}

function buildFallbackDescription(raw: RentCastPropertyRecord): string {
  const typeLabel = raw.propertyType ?? "Property";
  const sqftPart = raw.squareFootage ? `${raw.squareFootage.toLocaleString()} sqft` : null;
  const yearPart = raw.yearBuilt ? `built ${raw.yearBuilt}` : null;
  const details = [sqftPart, yearPart].filter(Boolean).join(", ");
  return details ? `${typeLabel} in ${raw.city}, ${raw.state}. ${details}.` : `${typeLabel} in ${raw.city}, ${raw.state}.`;
}

/** Merges active-listing fields onto an existing property record. Pass null when no listing was found.
 *
 * Bedrooms/bathrooms/square footage fall back to the listing's values when
 * the base property record (RentCast's public-record data) is missing
 * them — the active listing mirrors what's on the MLS/Zillow, and RentCast's
 * public-record source can lag or omit these fields even when the listing
 * itself has them. The property record's own value always wins when present;
 * this only fills gaps, never overrides. */
export function applyListing(property: PropertyRecord, listing: (RentCastSaleListing & { description?: string }) | null): PropertyRecord {
  if (!listing) return property;

  return {
    ...property,
    bedrooms: property.bedrooms ?? listing.bedrooms ?? null,
    bathrooms: property.bathrooms ?? listing.bathrooms ?? null,
    squareFootage: property.squareFootage ?? listing.squareFootage ?? null,
    listPriceCents: toCentsOrNull(listing.price),
    originalListPriceCents: toCentsOrNull(listing.price),
    listingStatus: listing.status ?? "Active",
    listedDate: listing.listedDate ?? null,
    daysOnMarket: listing.daysOnMarket ?? null,
    mlsId: listing.mlsNumber ?? null,
    hoaFeeCents: toCentsOrNull(listing.hoa?.fee),
    propertySubtype: listing.propertyType ?? property.propertySubtype,
    description: listing.description?.trim() ? listing.description.trim() : property.description,
  };
}

/** Merges AVM fields onto an existing property record. Pass null when no valuation was found. */
export function applyValuation(property: PropertyRecord, valuation: RentCastValueEstimate | null): PropertyRecord {
  if (!valuation) return property;

  return {
    ...property,
    currentValueCents: toCentsOrNull(valuation.price),
    valuationRangeLowCents: toCentsOrNull(valuation.priceRangeLow),
    valuationRangeHighCents: toCentsOrNull(valuation.priceRangeHigh),
    valuationDate: new Date().toISOString(),
  };
}

/**
 * Normalizes AVM comparables into ComparableSale[], dropping ones missing
 * the data required to use them (price or square footage), and defaulting
 * "included" to true only for comps that aren't currently active listings
 * (see docs/RENTCAST.md for why "sold" can't be asserted with certainty).
 */
export function normalizeComparables(raw: RentCastComparable[] | undefined, subject: PropertyRecord): ComparableSale[] {
  if (!raw) return [];

  const subjectSqft = subject.squareFootage ?? 1500;

  return raw
    .filter((c) => typeof c.price === "number" && typeof c.squareFootage === "number" && c.squareFootage > 0 && typeof c.distance === "number")
    .map((c, index): ComparableSale => {
      const salePriceCents = dollarsToCents(c.price as number);
      const squareFootage = c.squareFootage as number;
      const pricePerSqftCents = Math.round(salePriceCents / squareFootage);
      const isActive = (c.status ?? "").trim().toLowerCase() === "active";

      const daysOld = typeof c.lastSeenDate === "string" ? daysBetween(c.lastSeenDate, new Date().toISOString()) : null;

      const similarityScore =
        typeof c.correlation === "number" ? Math.round(Math.min(1, Math.max(0, c.correlation)) * 100) : null;

      return {
        id: c.id ?? `rentcast-comp-${index}`,
        address: c.formattedAddress,
        salePriceCents,
        saleDate: c.lastSeenDate ?? c.listedDate ?? new Date().toISOString().slice(0, 10),
        distanceMiles: Math.round((c.distance as number) * 10) / 10,
        squareFootage,
        pricePerSqftCents,
        bedrooms: c.bedrooms ?? subject.bedrooms ?? 0,
        bathrooms: c.bathrooms ?? subject.bathrooms ?? 0,
        similarityScore:
          similarityScore ??
          calculateRealOfferSimilarityScore({
            distanceMiles: c.distance as number,
            subjectSquareFootage: subjectSqft,
            compSquareFootage: squareFootage,
            subjectBedrooms: subject.bedrooms,
            compBedrooms: c.bedrooms ?? subject.bedrooms ?? 0,
            subjectBathrooms: subject.bathrooms,
            compBathrooms: c.bathrooms ?? subject.bathrooms ?? 0,
            daysOld,
            subjectPropertyType: subject.propertyType,
            compPropertyType: mapRentCastPropertyType(c.propertyType),
          }),
        similaritySource: similarityScore !== null ? "provider" : "calculated",
        saleType: isActive ? "active_listing" : c.status ? "sold" : "unknown",
        source: "rentcast",
        providerId: c.id ?? null,
        included: !isActive,
      };
    })
    .sort((a, b) => b.similarityScore - a.similarityScore);
}

function daysBetween(isoDate: string, isoNow: string): number | null {
  const then = new Date(isoDate).getTime();
  const now = new Date(isoNow).getTime();
  if (Number.isNaN(then) || Number.isNaN(now)) return null;
  return Math.max(0, Math.round((now - then) / (24 * 60 * 60 * 1000)));
}

/** Computes a completeness-based confidence rating for a real (RentCast-sourced) record. */
export function computeRealRecordConfidence(property: PropertyRecord): PropertyDataConfidence {
  const coreFieldsPresent = [property.squareFootage, property.bedrooms, property.bathrooms, property.yearBuilt].filter(
    (v) => v !== null,
  ).length;

  if (coreFieldsPresent === 4 && property.listingStatus !== null) return "high";
  if (coreFieldsPresent >= 2) return "medium";
  return "low";
}
