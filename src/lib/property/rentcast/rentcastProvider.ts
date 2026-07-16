import "server-only";
import { suggestArvFromComparables } from "@/lib/calculations/arv";
import { CONDITION_PRESETS } from "@/config/repairPresets";
import { fetchActiveSaleListings, fetchPropertyRecords, fetchValueEstimate, RentCastApiError } from "@/lib/property/rentcast/client";
import { applyListing, applyValuation, computeRealRecordConfidence, normalizeComparables, normalizePropertyRecord } from "@/lib/property/rentcast/normalize";
import type { NormalizedAddress, PropertyDataResult, PropertyRecord } from "@/lib/property/types";

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes — see docs/RENTCAST.md for rationale.

type CacheEntry = { result: PropertyDataResult; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<PropertyDataResult>>();

function toRentCastAddressString(address: NormalizedAddress): string {
  return `${address.line1}, ${address.city}, ${address.state} ${address.zip}`.trim();
}

/** Baseline repair suggestion: moderate-renovation preset midpoint x sqft. A starting point only — always user-adjustable. */
function estimateBaselineRepairCostCents(squareFootage: number | null): number {
  if (!squareFootage) return 0;
  const preset = CONDITION_PRESETS.moderate_renovation;
  const midpointPerSqft = Math.round((preset.costPerSqftCentsLow + preset.costPerSqftCentsHigh) / 2);
  return midpointPerSqft * squareFootage;
}

async function fetchAndNormalize(address: NormalizedAddress): Promise<PropertyDataResult> {
  const addressString = toRentCastAddressString(address);

  let records;
  try {
    records = await fetchPropertyRecords(addressString);
  } catch (err) {
    return { status: "error", error: err instanceof RentCastApiError ? err.toProviderError() : { code: "unknown", message: "Something went wrong looking up this property." } };
  }

  if (records.length === 0) {
    return { status: "error", error: { code: "not_found", message: "No property record was found for this address." } };
  }

  if (records.length > 1) {
    return {
      status: "ambiguous",
      candidates: records.slice(0, 5).map((r) => ({ providerId: r.id, formattedAddress: r.formattedAddress })),
    };
  }

  let property: PropertyRecord = normalizePropertyRecord(records[0], address);

  // Listing and valuation are independently optional — their absence is a
  // normal state (e.g. "property record found but no active listing"), not
  // a provider failure, so we don't let either reject the whole lookup.
  const [listingOutcome, valuationOutcome] = await Promise.allSettled([fetchActiveSaleListings(addressString), fetchValueEstimate(addressString)]);

  if (listingOutcome.status === "fulfilled" && listingOutcome.value.length > 0) {
    property = applyListing(property, listingOutcome.value[0]);
  }

  const valuation = valuationOutcome.status === "fulfilled" ? valuationOutcome.value : null;
  if (valuation) {
    property = applyValuation(property, valuation);
    property.comparables = normalizeComparables(valuation.comparables, property);
  }

  const arvSuggestion = suggestArvFromComparables(property.comparables, {
    lowCents: property.currentValueCents ? Math.round(property.currentValueCents * 0.93) : 0,
    expectedCents: property.currentValueCents ?? 0,
    highCents: property.currentValueCents ? Math.round(property.currentValueCents * 1.07) : 0,
  });
  property.arvLowCents = arvSuggestion.lowCents;
  property.arvExpectedCents = arvSuggestion.expectedCents;
  property.arvHighCents = arvSuggestion.highCents;
  property.suggestedRepairCostCents = estimateBaselineRepairCostCents(property.squareFootage);
  property.confidence = computeRealRecordConfidence(property);

  return { status: "ok", property };
}

export async function getRealPropertyData(address: NormalizedAddress, options?: { forceRefresh?: boolean }): Promise<PropertyDataResult> {
  const cacheKey = address.formatted;

  if (!options?.forceRefresh) {
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.result;

    const pending = inFlight.get(cacheKey);
    if (pending) return pending;
  }

  const promise = fetchAndNormalize(address).then((result) => {
    cache.set(cacheKey, { result, expiresAt: Date.now() + CACHE_TTL_MS });
    inFlight.delete(cacheKey);
    return result;
  });

  inFlight.set(cacheKey, promise);
  return promise;
}
