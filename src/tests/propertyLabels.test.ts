import { describe, expect, it } from "vitest";
import { formatBedsBaths } from "@/lib/property/labels";

describe("formatBedsBaths", () => {
  it("formats both values when present", () => {
    expect(formatBedsBaths(3, 2)).toBe("3 bd · 2 ba");
  });

  it("supports decimal bathroom values", () => {
    expect(formatBedsBaths(4, 2.5)).toBe("4 bd · 2.5 ba");
  });

  it("shows only bedrooms when bathrooms is unknown", () => {
    expect(formatBedsBaths(3, null)).toBe("3 bd");
  });

  it("shows only bathrooms when bedrooms is unknown", () => {
    expect(formatBedsBaths(null, 2)).toBe("2 ba");
  });

  it("returns null when both are unknown, never a fabricated 0", () => {
    expect(formatBedsBaths(null, null)).toBeNull();
  });

  it("preserves a genuine zero (e.g. a studio) rather than treating it as unknown", () => {
    expect(formatBedsBaths(0, 1)).toBe("0 bd · 1 ba");
  });
});
