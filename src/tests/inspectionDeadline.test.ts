import { describe, expect, it } from "vitest";
import { calculateInspectionDeadline } from "@/lib/contracts/inspectionDeadline";

describe("calculateInspectionDeadline", () => {
  it("adds the period in days to the effective date", () => {
    expect(calculateInspectionDeadline("2026-01-01T00:00:00.000Z", 10)).toBe("2026-01-11");
  });

  it("handles a zero-day period as the same day", () => {
    expect(calculateInspectionDeadline("2026-01-01T00:00:00.000Z", 0)).toBe("2026-01-01");
  });

  it("rolls over month boundaries correctly", () => {
    expect(calculateInspectionDeadline("2026-01-28T00:00:00.000Z", 5)).toBe("2026-02-02");
  });

  it("rolls over year boundaries correctly", () => {
    expect(calculateInspectionDeadline("2026-12-28T00:00:00.000Z", 10)).toBe("2027-01-07");
  });

  it("returns null when there is no effective date — never guesses one", () => {
    expect(calculateInspectionDeadline(null, 10)).toBeNull();
  });

  it("returns null when there is no period", () => {
    expect(calculateInspectionDeadline("2026-01-01T00:00:00.000Z", null)).toBeNull();
  });

  it("returns null for a negative period", () => {
    expect(calculateInspectionDeadline("2026-01-01T00:00:00.000Z", -3)).toBeNull();
  });

  it("returns null for an invalid effective date string", () => {
    expect(calculateInspectionDeadline("not-a-date", 10)).toBeNull();
  });

  it("is stable across a plain YYYY-MM-DD effective date, not just a full timestamp", () => {
    expect(calculateInspectionDeadline("2026-06-15", 7)).toBe("2026-06-22");
  });
});
