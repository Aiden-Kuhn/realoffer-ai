import type { ComparableSale, PropertyRecord } from "@/lib/property/types";
import type { Deal } from "@/types/deal";

/**
 * Coerces a possibly-older-shape deal object (parsed from localStorage JSON)
 * into the current Deal shape. Every field this milestone added to
 * PropertyRecord/ComparableSale/Deal is optional-at-rest — old demo deals
 * simply never had them, so `undefined` here means "predates this field,"
 * not "unavailable." Both cases render the same way (a "Not available" /
 * absent badge), so defaulting to null/"demo" is safe and non-destructive.
 */
export function normalizeLegacyDeal(raw: unknown): Deal {
  const deal = raw as Partial<Deal> & { property?: Partial<PropertyRecord> & Record<string, unknown> };

  const property = normalizeLegacyPropertyRecord(deal.property);
  const comparables = Array.isArray(deal.comparables) ? deal.comparables.map(normalizeLegacyComparable) : [];

  return {
    ...(deal as Deal),
    property,
    comparables,
    dataMode: deal.dataMode ?? (property.source === "rentcast" ? "real" : "demo"),
  };
}

function normalizeLegacyPropertyRecord(raw: (Partial<PropertyRecord> & Record<string, unknown>) | undefined): PropertyRecord {
  const p = raw ?? {};
  return {
    address: (p.address as PropertyRecord["address"]) ?? { line1: "", city: "", state: "", zip: "", formatted: "" },
    bedrooms: p.bedrooms ?? null,
    bathrooms: p.bathrooms ?? null,
    squareFootage: p.squareFootage ?? null,
    lotSizeSqft: p.lotSizeSqft ?? null,
    yearBuilt: p.yearBuilt ?? null,
    propertyType: p.propertyType ?? "single_family",
    county: p.county ?? null,
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    lastSaleDate: p.lastSaleDate ?? null,
    lastSalePriceCents: p.lastSalePriceCents ?? null,
    taxAssessedValueCents: p.taxAssessedValueCents ?? null,
    annualPropertyTaxCents: p.annualPropertyTaxCents ?? null,
    providerRecordId: p.providerRecordId ?? null,
    listPriceCents: p.listPriceCents ?? null,
    originalListPriceCents: p.originalListPriceCents ?? p.listPriceCents ?? null,
    listingStatus: p.listingStatus ?? (p.listPriceCents ? "Active" : null),
    listedDate: p.listedDate ?? null,
    daysOnMarket: p.daysOnMarket ?? null,
    mlsId: p.mlsId ?? null,
    hoaFeeCents: p.hoaFeeCents ?? null,
    propertySubtype: p.propertySubtype ?? null,
    description: p.description ?? "",
    currentValueCents: p.currentValueCents ?? null,
    valuationRangeLowCents: p.valuationRangeLowCents ?? null,
    valuationRangeHighCents: p.valuationRangeHighCents ?? null,
    valuationDate: p.valuationDate ?? null,
    arvLowCents: p.arvLowCents ?? 0,
    arvExpectedCents: p.arvExpectedCents ?? 0,
    arvHighCents: p.arvHighCents ?? 0,
    suggestedRepairCostCents: p.suggestedRepairCostCents ?? 0,
    comparables: Array.isArray(p.comparables) ? p.comparables.map(normalizeLegacyComparable) : [],
    source: p.source ?? "simulated",
    confidence: p.confidence ?? "medium",
    lastUpdated: p.lastUpdated ?? new Date(0).toISOString(),
    profile: p.profile,
  };
}

function normalizeLegacyComparable(raw: Partial<ComparableSale> & Record<string, unknown>): ComparableSale {
  return {
    id: raw.id ?? crypto.randomUUID(),
    address: raw.address ?? "",
    salePriceCents: raw.salePriceCents ?? 0,
    saleDate: raw.saleDate ?? new Date(0).toISOString(),
    distanceMiles: raw.distanceMiles ?? 0,
    squareFootage: raw.squareFootage ?? 0,
    pricePerSqftCents: raw.pricePerSqftCents ?? 0,
    bedrooms: raw.bedrooms ?? 0,
    bathrooms: raw.bathrooms ?? 0,
    similarityScore: raw.similarityScore ?? 0,
    similaritySource: raw.similaritySource ?? "calculated",
    saleType: raw.saleType ?? "sold",
    source: raw.source ?? "simulated",
    providerId: raw.providerId ?? null,
    included: raw.included ?? true,
  };
}
