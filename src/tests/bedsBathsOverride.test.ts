import { describe, expect, it } from "vitest";
import {
  resolveEffectiveBedsBaths,
  withEffectiveBedsBaths,
  parseBedroomsOverride,
  parseBathroomsOverride,
} from "@/lib/property/bedsBathsOverride";
import type { PropertyRecord } from "@/lib/property/types";

function makeProperty(overrides: Partial<Pick<PropertyRecord, "bedrooms" | "bathrooms">> = {}): Pick<PropertyRecord, "bedrooms" | "bathrooms"> {
  return { bedrooms: 2, bathrooms: 1, ...overrides };
}

describe("resolveEffectiveBedsBaths", () => {
  it("uses the provider value when there is no override", () => {
    const effective = resolveEffectiveBedsBaths({ property: makeProperty(), bedroomsOverride: null, bathroomsOverride: null });
    expect(effective).toEqual({ bedrooms: 2, bathrooms: 1, bedroomsIsOverridden: false, bathroomsIsOverridden: false });
  });

  it("uses the provider value when the override fields are entirely absent (backward compatibility)", () => {
    const effective = resolveEffectiveBedsBaths({ property: makeProperty() });
    expect(effective.bedrooms).toBe(2);
    expect(effective.bathrooms).toBe(1);
    expect(effective.bedroomsIsOverridden).toBe(false);
    expect(effective.bathroomsIsOverridden).toBe(false);
  });

  it("prefers a bedroom override over the provider value", () => {
    const effective = resolveEffectiveBedsBaths({ property: makeProperty(), bedroomsOverride: 3, bathroomsOverride: null });
    expect(effective.bedrooms).toBe(3);
    expect(effective.bedroomsIsOverridden).toBe(true);
    expect(effective.bathrooms).toBe(1);
    expect(effective.bathroomsIsOverridden).toBe(false);
  });

  it("prefers a bathroom override over the provider value, including decimals", () => {
    const effective = resolveEffectiveBedsBaths({ property: makeProperty(), bedroomsOverride: null, bathroomsOverride: 2.5 });
    expect(effective.bathrooms).toBe(2.5);
    expect(effective.bathroomsIsOverridden).toBe(true);
  });

  it("supports overriding to a genuine zero without treating it as missing", () => {
    const effective = resolveEffectiveBedsBaths({ property: makeProperty({ bedrooms: null }), bedroomsOverride: 0, bathroomsOverride: null });
    expect(effective.bedrooms).toBe(0);
    expect(effective.bedroomsIsOverridden).toBe(true);
  });

  it("falls back to the provider value (even null) when the override is explicitly removed", () => {
    const effective = resolveEffectiveBedsBaths({ property: makeProperty({ bedrooms: null }), bedroomsOverride: null, bathroomsOverride: null });
    expect(effective.bedrooms).toBeNull();
    expect(effective.bedroomsIsOverridden).toBe(false);
  });
});

describe("withEffectiveBedsBaths", () => {
  it("returns the same object reference when there is no override", () => {
    const property = { bedrooms: 2, bathrooms: 1 } as PropertyRecord;
    expect(withEffectiveBedsBaths(property, null, null)).toBe(property);
  });

  it("returns a copy with bedrooms/bathrooms replaced when overridden, without mutating the original", () => {
    const property = { bedrooms: 2, bathrooms: 1 } as PropertyRecord;
    const result = withEffectiveBedsBaths(property, 4, 2.5);
    expect(result).not.toBe(property);
    expect(result.bedrooms).toBe(4);
    expect(result.bathrooms).toBe(2.5);
    expect(property.bedrooms).toBe(2);
    expect(property.bathrooms).toBe(1);
  });
});

describe("parseBedroomsOverride", () => {
  it("treats a blank input as clearing the override, not an error", () => {
    expect(parseBedroomsOverride("")).toEqual({ ok: true, value: null });
    expect(parseBedroomsOverride("   ")).toEqual({ ok: true, value: null });
  });

  it("accepts a valid nonnegative whole number", () => {
    expect(parseBedroomsOverride("4")).toEqual({ ok: true, value: 4 });
  });

  it("accepts zero as a genuine value", () => {
    expect(parseBedroomsOverride("0")).toEqual({ ok: true, value: 0 });
  });

  it("rejects a negative number", () => {
    const result = parseBedroomsOverride("-1");
    expect(result.ok).toBe(false);
  });

  it("rejects a non-integer", () => {
    const result = parseBedroomsOverride("2.5");
    expect(result.ok).toBe(false);
  });

  it("rejects an unreasonably large number", () => {
    const result = parseBedroomsOverride("500");
    expect(result.ok).toBe(false);
  });

  it("rejects non-numeric input", () => {
    const result = parseBedroomsOverride("abc");
    expect(result.ok).toBe(false);
  });
});

describe("parseBathroomsOverride", () => {
  it("treats a blank input as clearing the override", () => {
    expect(parseBathroomsOverride("")).toEqual({ ok: true, value: null });
  });

  it("accepts whole numbers", () => {
    expect(parseBathroomsOverride("3")).toEqual({ ok: true, value: 3 });
  });

  it("accepts half increments", () => {
    expect(parseBathroomsOverride("2.5")).toEqual({ ok: true, value: 2.5 });
  });

  it("rejects increments finer than a half", () => {
    const result = parseBathroomsOverride("2.25");
    expect(result.ok).toBe(false);
  });

  it("rejects a negative number", () => {
    const result = parseBathroomsOverride("-0.5");
    expect(result.ok).toBe(false);
  });

  it("rejects an unreasonably large number", () => {
    const result = parseBathroomsOverride("100");
    expect(result.ok).toBe(false);
  });
});
