import { describe, expect, it } from "vitest";
import { dueDiligenceDefaultsValuesSchema } from "@/lib/contractDefaults/schema";
import { emptyDueDiligenceDefaultsValues } from "@/lib/contractDefaults/types";

function base(overrides: Partial<ReturnType<typeof emptyDueDiligenceDefaultsValues>> = {}) {
  return { ...emptyDueDiligenceDefaultsValues(), ...overrides };
}

describe("dueDiligenceDefaultsValuesSchema", () => {
  it("accepts a fully-filled set of defaults", () => {
    const result = dueDiligenceDefaultsValuesSchema.safeParse(
      base({
        inspectionPeriodDays: 10,
        titleReviewPeriodDays: 14,
        rightToTerminateDuringInspection: true,
        surveyRequired: true,
        propertyCondition: "as_is",
        propertyAccessTerms: "Business hours, 24hr notice",
        dueDiligenceNotes: "Confirm HOA docs",
      }),
    );
    expect(result.success).toBe(true);
  });

  it("preserves an entirely empty draft — nothing is required", () => {
    const result = dueDiligenceDefaultsValuesSchema.safeParse(base());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.inspectionPeriodDays).toBeNull();
      expect(result.data.propertyCondition).toBeNull();
    }
  });

  it("rejects a negative inspection period", () => {
    const result = dueDiligenceDefaultsValuesSchema.safeParse(base({ inspectionPeriodDays: -1 }));
    expect(result.success).toBe(false);
  });

  it("rejects an unreasonably large inspection period", () => {
    const result = dueDiligenceDefaultsValuesSchema.safeParse(base({ inspectionPeriodDays: 99999 }));
    expect(result.success).toBe(false);
  });

  it("accepts an inspection period of zero", () => {
    const result = dueDiligenceDefaultsValuesSchema.safeParse(base({ inspectionPeriodDays: 0 }));
    expect(result.success).toBe(true);
  });

  it("rejects a non-integer inspection period", () => {
    const result = dueDiligenceDefaultsValuesSchema.safeParse(base({ inspectionPeriodDays: 5.5 }));
    expect(result.success).toBe(false);
  });

  it("rejects a negative title review period", () => {
    const result = dueDiligenceDefaultsValuesSchema.safeParse(base({ titleReviewPeriodDays: -5 }));
    expect(result.success).toBe(false);
  });

  it("rejects an unsupported property-condition value", () => {
    const result = dueDiligenceDefaultsValuesSchema.safeParse(base({ propertyCondition: "totally_renovated" as never }));
    expect(result.success).toBe(false);
  });

  it("accepts each of the supported controlled property-condition options", () => {
    for (const condition of ["as_is", "seller_to_repair", "other"] as const) {
      const result = dueDiligenceDefaultsValuesSchema.safeParse(base({ propertyCondition: condition }));
      expect(result.success).toBe(true);
    }
  });

  it("rejects unreasonably long free text", () => {
    const result = dueDiligenceDefaultsValuesSchema.safeParse(base({ dueDiligenceNotes: "x".repeat(10_000) }));
    expect(result.success).toBe(false);
  });
});
