import { describe, expect, it } from "vitest";
import {
  applyListing,
  applyValuation,
  computeRealRecordConfidence,
  mapRentCastPropertyType,
  normalizeComparables,
  normalizePropertyRecord,
} from "@/lib/property/rentcast/normalize";
import { suggestArvFromComparables } from "@/lib/calculations/arv";
import { normalizeManualAddress } from "@/lib/property/normalizeAddress";
import type { RentCastComparable, RentCastPropertyRecord, RentCastSaleListing, RentCastValueEstimate } from "@/lib/property/rentcast/rawTypes";

const address = normalizeManualAddress({ line1: "5500 Grand Lake Dr", city: "San Antonio", state: "TX", zip: "78244" });

const fullRecord: RentCastPropertyRecord = {
  id: "5500-Grand-Lake-Dr,-San-Antonio,-TX-78244",
  formattedAddress: "5500 Grand Lake Dr, San Antonio, TX 78244",
  city: "San Antonio",
  state: "TX",
  zipCode: "78244",
  county: "Bexar",
  latitude: 29.475962,
  longitude: -98.351442,
  propertyType: "Single Family",
  bedrooms: 3,
  bathrooms: 2,
  squareFootage: 1878,
  lotSize: 8850,
  yearBuilt: 1973,
  lastSaleDate: "2024-11-18T00:00:00.000Z",
  lastSalePrice: 270000,
  taxAssessments: {
    "2023": { year: 2023, value: 200000 },
    "2024": { year: 2024, value: 216513, land: 59380, improvements: 157133 },
  },
  propertyTaxes: {
    "2024": { year: 2024, total: 4065 },
  },
};

describe("mapRentCastPropertyType", () => {
  it("maps known RentCast type strings to internal types", () => {
    expect(mapRentCastPropertyType("Single Family")).toBe("single_family");
    expect(mapRentCastPropertyType("Condo")).toBe("condo");
    expect(mapRentCastPropertyType("Multi-Family")).toBe("multi_family");
    expect(mapRentCastPropertyType("Apartment")).toBe("multi_family");
    expect(mapRentCastPropertyType("Land")).toBe("land");
  });

  it("defaults unknown or missing types to single_family rather than throwing", () => {
    expect(mapRentCastPropertyType(undefined)).toBe("single_family");
    expect(mapRentCastPropertyType("Something RentCast Invented")).toBe("single_family");
  });
});

describe("normalizePropertyRecord", () => {
  it("maps every documented field from a full RentCast record", () => {
    const property = normalizePropertyRecord(fullRecord, address);
    expect(property.bedrooms).toBe(3);
    expect(property.bathrooms).toBe(2);
    expect(property.squareFootage).toBe(1878);
    expect(property.lotSizeSqft).toBe(8850);
    expect(property.yearBuilt).toBe(1973);
    expect(property.county).toBe("Bexar");
    expect(property.lastSaleDate).toBe("2024-11-18T00:00:00.000Z");
    expect(property.lastSalePriceCents).toBe(27_000_000);
    expect(property.source).toBe("rentcast");
    // picks the most recent (2024) tax assessment/tax record, not 2023
    expect(property.taxAssessedValueCents).toBe(21_651_300);
    expect(property.annualPropertyTaxCents).toBe(406_500);
    expect(property.providerRecordId).toBe(fullRecord.id);
  });

  it("never invents values for missing fields — they stay null", () => {
    const sparse: RentCastPropertyRecord = { id: "x", formattedAddress: "1 Empty St", city: "Nowhere", state: "TX", zipCode: "00000" };
    const property = normalizePropertyRecord(sparse, address);
    expect(property.bedrooms).toBeNull();
    expect(property.bathrooms).toBeNull();
    expect(property.squareFootage).toBeNull();
    expect(property.yearBuilt).toBeNull();
    expect(property.lastSaleDate).toBeNull();
    expect(property.taxAssessedValueCents).toBeNull();
    expect(property.listPriceCents).toBeNull();
    expect(property.currentValueCents).toBeNull();
  });
});

describe("applyListing", () => {
  const base = normalizePropertyRecord(fullRecord, address);

  it("merges active-listing fields onto the base property record", () => {
    const listing: RentCastSaleListing = {
      id: "listing-1",
      formattedAddress: fullRecord.formattedAddress,
      price: 899000,
      status: "Active",
      listedDate: "2024-06-24T00:00:00.000Z",
      daysOnMarket: 99,
      mlsNumber: "5519228",
      hoa: { fee: 65 },
    };
    const withListing = applyListing(base, listing);
    expect(withListing.listPriceCents).toBe(89_900_000);
    expect(withListing.listingStatus).toBe("Active");
    expect(withListing.daysOnMarket).toBe(99);
    expect(withListing.mlsId).toBe("5519228");
    expect(withListing.hoaFeeCents).toBe(6_500);
  });

  it("leaves the property record unchanged (listing fields null) when no listing was found", () => {
    const withoutListing = applyListing(base, null);
    expect(withoutListing.listPriceCents).toBeNull();
    expect(withoutListing.listingStatus).toBeNull();
    expect(withoutListing.daysOnMarket).toBeNull();
    // property-record facts are still present — "no listing" isn't "no property"
    expect(withoutListing.bedrooms).toBe(3);
  });

  it("fills bedrooms/bathrooms/squareFootage from the listing when the base property record is missing them", () => {
    // Regression test: RentCast's public-record source (/v1/properties) can
    // lack these fields even when the active listing (what Zillow shows)
    // has them — applyListing must not silently discard the listing's
    // values for the fields it actually carries.
    const sparse: RentCastPropertyRecord = { id: "x", formattedAddress: "1 Sparse St", city: "San Antonio", state: "TX", zipCode: "78244" };
    const sparseProperty = normalizePropertyRecord(sparse, address);
    expect(sparseProperty.bedrooms).toBeNull();
    expect(sparseProperty.bathrooms).toBeNull();
    expect(sparseProperty.squareFootage).toBeNull();

    const listing: RentCastSaleListing = {
      id: "listing-2",
      formattedAddress: "1 Sparse St, San Antonio, TX 78244",
      bedrooms: 4,
      bathrooms: 2.5,
      squareFootage: 2100,
      price: 450000,
      status: "Active",
    };
    const withListing = applyListing(sparseProperty, listing);
    expect(withListing.bedrooms).toBe(4);
    expect(withListing.bathrooms).toBe(2.5);
    expect(withListing.squareFootage).toBe(2100);
  });

  it("never overrides bedrooms/bathrooms/squareFootage already present on the base property record", () => {
    // The property record's own value is preferred — the listing is a
    // fallback for gaps, not a source of truth that overwrites it.
    const listing: RentCastSaleListing = {
      id: "listing-3",
      formattedAddress: fullRecord.formattedAddress,
      bedrooms: 5,
      bathrooms: 4,
      squareFootage: 9999,
      price: 500000,
      status: "Active",
    };
    const withListing = applyListing(base, listing);
    expect(withListing.bedrooms).toBe(3);
    expect(withListing.bathrooms).toBe(2);
    expect(withListing.squareFootage).toBe(1878);
  });

  it("leaves bedrooms/bathrooms/squareFootage null when neither the property record nor the listing has them", () => {
    const sparse: RentCastPropertyRecord = { id: "x", formattedAddress: "1 Empty St", city: "Nowhere", state: "TX", zipCode: "00000" };
    const sparseProperty = normalizePropertyRecord(sparse, address);
    const listing: RentCastSaleListing = { id: "listing-4", formattedAddress: "1 Empty St", price: 200000, status: "Active" };
    const withListing = applyListing(sparseProperty, listing);
    expect(withListing.bedrooms).toBeNull();
    expect(withListing.bathrooms).toBeNull();
    expect(withListing.squareFootage).toBeNull();
  });
});

describe("applyValuation", () => {
  const base = normalizePropertyRecord(fullRecord, address);

  it("maps AVM price and range without touching ARV fields", () => {
    const valuation: RentCastValueEstimate = { price: 250000, priceRangeLow: 195000, priceRangeHigh: 304000 };
    const withValuation = applyValuation(base, valuation);
    expect(withValuation.currentValueCents).toBe(25_000_000);
    expect(withValuation.valuationRangeLowCents).toBe(19_500_000);
    expect(withValuation.valuationRangeHighCents).toBe(30_400_000);
    // AVM must never silently become the ARV
    expect(withValuation.arvExpectedCents).toBe(base.arvExpectedCents);
  });

  it("leaves valuation fields null when no valuation was found", () => {
    const withoutValuation = applyValuation(base, null);
    expect(withoutValuation.currentValueCents).toBeNull();
    expect(withoutValuation.valuationRangeLowCents).toBeNull();
  });
});

describe("normalizeComparables", () => {
  const subject = normalizePropertyRecord(fullRecord, address);

  const rawComps: RentCastComparable[] = [
    {
      id: "comp-1",
      formattedAddress: "5207 Pine Lake Dr, San Antonio, TX 78244",
      propertyType: "Single Family",
      bedrooms: 3,
      bathrooms: 2,
      squareFootage: 1895,
      yearBuilt: 1988,
      price: 289444,
      status: "Inactive",
      distance: 0.384,
      correlation: 0.9916,
      lastSeenDate: "2025-09-03T10:57:39.532Z",
    },
    {
      id: "comp-2",
      formattedAddress: "5300 Active St, San Antonio, TX 78244",
      propertyType: "Single Family",
      bedrooms: 3,
      bathrooms: 2,
      squareFootage: 1900,
      price: 310000,
      status: "Active",
      distance: 1.2,
      // no correlation supplied — must fall back to the calculated formula
    },
    {
      // missing price entirely — must be dropped, not defaulted to 0
      id: "comp-3",
      formattedAddress: "Incomplete comp",
      squareFootage: 1500,
      distance: 0.5,
    },
  ];

  it("drops comparables missing price, square footage, or distance", () => {
    const comps = normalizeComparables(rawComps, subject);
    expect(comps.find((c) => c.id === "comp-3")).toBeUndefined();
    expect(comps).toHaveLength(2);
  });

  it("uses the provider correlation as the similarity score when present", () => {
    const comps = normalizeComparables(rawComps, subject);
    const comp1 = comps.find((c) => c.id === "comp-1")!;
    expect(comp1.similarityScore).toBe(99);
    expect(comp1.similaritySource).toBe("provider");
  });

  it("falls back to the RealOffer calculated score when correlation is absent", () => {
    const comps = normalizeComparables(rawComps, subject);
    const comp2 = comps.find((c) => c.id === "comp-2")!;
    expect(comp2.similaritySource).toBe("calculated");
    expect(comp2.similarityScore).toBeGreaterThanOrEqual(0);
    expect(comp2.similarityScore).toBeLessThanOrEqual(100);
  });

  it("labels Active-status comps as active_listing and excludes them by default", () => {
    const comps = normalizeComparables(rawComps, subject);
    const active = comps.find((c) => c.id === "comp-2")!;
    expect(active.saleType).toBe("active_listing");
    expect(active.included).toBe(false);
  });

  it("labels non-Active comps as sold and includes them by default", () => {
    const comps = normalizeComparables(rawComps, subject);
    const inactive = comps.find((c) => c.id === "comp-1")!;
    expect(inactive.saleType).toBe("sold");
    expect(inactive.included).toBe(true);
  });

  it("returns an empty array when there are no comparables", () => {
    expect(normalizeComparables(undefined, subject)).toEqual([]);
    expect(normalizeComparables([], subject)).toEqual([]);
  });
});

describe("ARV suggestion from real RentCast comparables", () => {
  const subject = normalizePropertyRecord(fullRecord, address);
  const rawComps: RentCastComparable[] = [
    { id: "c1", formattedAddress: "A", propertyType: "Single Family", bedrooms: 3, bathrooms: 2, squareFootage: 1850, price: 280000, status: "Inactive", distance: 0.3, correlation: 0.95 },
    { id: "c2", formattedAddress: "B", propertyType: "Single Family", bedrooms: 3, bathrooms: 2, squareFootage: 1900, price: 300000, status: "Inactive", distance: 0.6, correlation: 0.9 },
    { id: "c3", formattedAddress: "C (active, excluded by default)", propertyType: "Single Family", bedrooms: 3, bathrooms: 2, squareFootage: 1800, price: 999999, status: "Active", distance: 0.1, correlation: 0.99 },
  ];

  it("computes a weighted ARV suggestion from only the default-included (non-active) comps", () => {
    const comps = normalizeComparables(rawComps, subject);
    const suggestion = suggestArvFromComparables(comps, { lowCents: 0, expectedCents: 0, highCents: 0 });

    // Expected value should sit between the two included comps' prices,
    // and must not be pulled toward the excluded active-listing comp's
    // inflated price.
    expect(suggestion.expectedCents).toBeGreaterThan(28_000_000);
    expect(suggestion.expectedCents).toBeLessThan(30_000_000);
    expect(suggestion.lowCents).toBeLessThan(suggestion.expectedCents);
    expect(suggestion.highCents).toBeGreaterThan(suggestion.expectedCents);
  });

  it("shifts the suggestion when the user includes the active-listing comp", () => {
    const comps = normalizeComparables(rawComps, subject).map((c) => (c.id === "c3" ? { ...c, included: true } : c));
    const suggestion = suggestArvFromComparables(comps, { lowCents: 0, expectedCents: 0, highCents: 0 });
    expect(suggestion.expectedCents).toBeGreaterThan(30_000_000);
  });
});

describe("computeRealRecordConfidence", () => {
  it("rates a complete record with an active listing as high confidence", () => {
    const property = applyListing(normalizePropertyRecord(fullRecord, address), {
      id: "l1",
      formattedAddress: fullRecord.formattedAddress,
      price: 300000,
      status: "Active",
    });
    expect(computeRealRecordConfidence(property)).toBe("high");
  });

  it("rates a record with core facts but no listing as medium", () => {
    const property = normalizePropertyRecord(fullRecord, address);
    expect(computeRealRecordConfidence(property)).toBe("medium");
  });

  it("rates a sparse record as low", () => {
    const sparse: RentCastPropertyRecord = { id: "x", formattedAddress: "1 Empty St", city: "Nowhere", state: "TX", zipCode: "00000" };
    const property = normalizePropertyRecord(sparse, address);
    expect(computeRealRecordConfidence(property)).toBe("low");
  });
});
