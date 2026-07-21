import { describe, expect, it } from "vitest";
import { buyerProfileSchema } from "@/lib/buyerProfile/schema";
import { emptyBuyerProfileFields } from "@/lib/buyerProfile/types";

function base(overrides: Partial<ReturnType<typeof emptyBuyerProfileFields>> = {}) {
  return { ...emptyBuyerProfileFields(), legalName: "Jamie Rivera", ...overrides };
}

describe("buyerProfileSchema", () => {
  it("accepts a fully-filled profile", () => {
    const result = buyerProfileSchema.safeParse(
      base({
        entityName: "Rivera Capital LLC",
        mailingAddressLine1: "123 Main St",
        mailingCity: "Austin",
        mailingState: "tx",
        mailingZip: "78701",
        email: "jamie@example.com",
        phone: "512-555-0100",
      }),
    );
    expect(result.success).toBe(true);
  });

  it("requires a non-blank legal name", () => {
    const result = buyerProfileSchema.safeParse(base({ legalName: "" }));
    expect(result.success).toBe(false);
  });

  it("requires a non-blank legal name even if it's only whitespace", () => {
    const result = buyerProfileSchema.safeParse(base({ legalName: "   " }));
    expect(result.success).toBe(false);
  });

  it("preserves an incomplete draft — every optional field may be blank", () => {
    const result = buyerProfileSchema.safeParse(base());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("");
      expect(result.data.phone).toBe("");
      expect(result.data.mailingState).toBe("");
    }
  });

  it("rejects an invalid email", () => {
    const result = buyerProfileSchema.safeParse(base({ email: "not-an-email" }));
    expect(result.success).toBe(false);
  });

  it("accepts a blank email (optional field)", () => {
    const result = buyerProfileSchema.safeParse(base({ email: "" }));
    expect(result.success).toBe(true);
  });

  it("rejects an invalid phone number", () => {
    const result = buyerProfileSchema.safeParse(base({ phone: "abc" }));
    expect(result.success).toBe(false);
  });

  it("accepts a reasonably formatted phone number", () => {
    const result = buyerProfileSchema.safeParse(base({ phone: "(512) 555-0100" }));
    expect(result.success).toBe(true);
  });

  it("normalizes state to uppercase", () => {
    const result = buyerProfileSchema.safeParse(base({ mailingState: "tx" }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.mailingState).toBe("TX");
  });

  it("rejects a state that isn't a 2-letter code", () => {
    const result = buyerProfileSchema.safeParse(base({ mailingState: "Texas" }));
    expect(result.success).toBe(false);
  });

  it("accepts a plain 5-digit ZIP", () => {
    const result = buyerProfileSchema.safeParse(base({ mailingZip: "78701" }));
    expect(result.success).toBe(true);
  });

  it("accepts a ZIP+4", () => {
    const result = buyerProfileSchema.safeParse(base({ mailingZip: "78701-1234" }));
    expect(result.success).toBe(true);
  });

  it("rejects a malformed ZIP", () => {
    const result = buyerProfileSchema.safeParse(base({ mailingZip: "not-a-zip" }));
    expect(result.success).toBe(false);
  });
});
