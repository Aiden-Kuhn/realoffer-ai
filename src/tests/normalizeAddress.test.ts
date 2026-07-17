import { describe, expect, it } from "vitest";
import {
  isAddressLikelyComplete,
  normalizeManualAddress,
  normalizeSlugAddress,
  parseFormattedAddressForPrefill,
} from "@/lib/property/normalizeAddress";

describe("normalizeManualAddress", () => {
  it("title-cases the street and city, uppercases the state, and builds a stable formatted key", () => {
    const address = normalizeManualAddress({ line1: "123 main st", city: "austin", state: "tx", zip: "78701" });
    expect(address.line1).toBe("123 Main St");
    expect(address.city).toBe("Austin");
    expect(address.state).toBe("TX");
    expect(address.zip).toBe("78701");
    expect(address.formatted).toBe("123 MAIN ST, AUSTIN, TX 78701");
  });

  it("is deterministic — same input always produces the same formatted key", () => {
    const a = normalizeManualAddress({ line1: "1 Test Way", city: "Denver", state: "CO", zip: "80202" });
    const b = normalizeManualAddress({ line1: "1 Test Way", city: "Denver", state: "CO", zip: "80202" });
    expect(a.formatted).toBe(b.formatted);
  });
});

describe("normalizeSlugAddress", () => {
  it("splits a hyphenated slug into street, city, state, and zip", () => {
    const address = normalizeSlugAddress("123-Main-St-Austin-TX-78701");
    expect(address.state).toBe("TX");
    expect(address.zip).toBe("78701");
    expect(address.city).toBe("Austin");
    expect(address.line1).toBe("123 Main St");
  });

  it("falls back gracefully when the slug has no recognizable state/zip", () => {
    const address = normalizeSlugAddress("some-weird-slug-with-no-location");
    expect(address.formatted.length).toBeGreaterThan(0);
  });
});

describe("isAddressLikelyComplete", () => {
  it("is true when a slug parses out a full city/state/zip", () => {
    const address = normalizeSlugAddress("123-Main-St-Austin-TX-78701");
    expect(isAddressLikelyComplete(address)).toBe(true);
  });

  it("is false when a slug has no recognizable state or zip", () => {
    const address = normalizeSlugAddress("some-weird-slug-with-no-location");
    expect(isAddressLikelyComplete(address)).toBe(false);
  });

  it("is false when city, state, or zip is individually missing", () => {
    expect(isAddressLikelyComplete({ city: "", state: "TX", zip: "78701" })).toBe(false);
    expect(isAddressLikelyComplete({ city: "Austin", state: "", zip: "78701" })).toBe(false);
    expect(isAddressLikelyComplete({ city: "Austin", state: "TX", zip: "" })).toBe(false);
  });
});

describe("parseFormattedAddressForPrefill", () => {
  it("splits a comma-separated formatted address into manual form fields", () => {
    const parsed = parseFormattedAddressForPrefill("123 Main St, Denver, CO 80202");
    expect(parsed).toEqual({ line1: "123 Main St", city: "Denver", state: "CO", zip: "80202" });
  });

  it("degrades gracefully when the state/zip segment is missing", () => {
    const parsed = parseFormattedAddressForPrefill("123 Main St, Denver");
    expect(parsed.line1).toBe("123 Main St");
    expect(parsed.city).toBe("Denver");
    expect(parsed.state).toBe("");
    expect(parsed.zip).toBe("");
  });
});
