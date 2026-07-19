import { describe, expect, it } from "vitest";
import { collectAdvisoryWarnings, collectReadyForReviewIssues, contractFormDataSchema } from "@/lib/contracts/schema";
import { emptyContractFormData } from "@/lib/contracts/templates/generalPurchaseAgreement";

const CREATED_AT = "2026-01-01T00:00:00.000Z";

function complete() {
  const data = emptyContractFormData();
  data.buyer.legalName = "Jamie Rivera";
  data.buyer.email = "jamie@example.com";
  data.buyer.phone = "512-555-0100";
  data.seller.legalName = "Pat Seller";
  data.property.addressLine1 = "123 Main St";
  data.property.city = "Austin";
  data.property.state = "TX";
  data.property.zip = "78701";
  data.purchaseTerms.purchasePriceCents = 30_000_000;
  data.purchaseTerms.purchasePriceSource = "proposed_contract_price";
  data.purchaseTerms.closingDate = "2026-02-01";
  return data;
}

describe("contractFormDataSchema", () => {
  it("accepts a fully empty form (drafts are never blocked by shape validation)", () => {
    expect(() => contractFormDataSchema.parse(emptyContractFormData())).not.toThrow();
  });

  it("rejects an invalid financing type rather than silently coercing it", () => {
    const data = { ...emptyContractFormData(), purchaseTerms: { ...emptyContractFormData().purchaseTerms, financingType: "bitcoin" } };
    expect(contractFormDataSchema.safeParse(data).success).toBe(false);
  });

  it("rejects a negative purchase price", () => {
    const data = { ...emptyContractFormData(), purchaseTerms: { ...emptyContractFormData().purchaseTerms, purchasePriceCents: -100 } };
    expect(contractFormDataSchema.safeParse(data).success).toBe(false);
  });

  it("caps free-text field length (defense against unbounded storage/XSS payloads)", () => {
    const data = { ...emptyContractFormData(), additionalTerms: { ...emptyContractFormData().additionalTerms, otherTerms: "x".repeat(10_000) } };
    expect(contractFormDataSchema.safeParse(data).success).toBe(false);
  });

  it("caps the number of additional buyers/sellers", () => {
    const data = { ...emptyContractFormData(), additionalBuyers: Array.from({ length: 10 }, () => emptyContractFormData().buyer) };
    expect(contractFormDataSchema.safeParse(data).success).toBe(false);
  });
});

describe("collectReadyForReviewIssues", () => {
  it("returns no issues for a fully completed contract", () => {
    const parsed = contractFormDataSchema.parse(complete());
    expect(collectReadyForReviewIssues(parsed, CREATED_AT)).toEqual([]);
  });

  it("flags missing buyer and seller names", () => {
    const parsed = contractFormDataSchema.parse(emptyContractFormData());
    const issues = collectReadyForReviewIssues(parsed, CREATED_AT);
    expect(issues).toContain("Buyer legal name is required.");
    expect(issues).toContain("Seller legal name is required.");
  });

  it("flags a purchase price of zero or missing", () => {
    const parsed = contractFormDataSchema.parse(complete());
    const zeroed = { ...parsed, purchaseTerms: { ...parsed.purchaseTerms, purchasePriceCents: 0 } };
    expect(collectReadyForReviewIssues(zeroed, CREATED_AT)).toContain("Purchase price must be greater than zero.");
  });

  it("flags a closing date before the contract's created date", () => {
    const parsed = contractFormDataSchema.parse(complete());
    const backdated = { ...parsed, purchaseTerms: { ...parsed.purchaseTerms, closingDate: "2025-01-01" } };
    expect(collectReadyForReviewIssues(backdated, CREATED_AT)).toContain("Closing date must be on or after the contract date.");
  });

  it("flags an inspection deadline after the closing date", () => {
    const parsed = contractFormDataSchema.parse(complete());
    const withInspection = {
      ...parsed,
      dueDiligence: { ...parsed.dueDiligence, inspectionDeadline: "2026-03-01" },
      purchaseTerms: { ...parsed.purchaseTerms, closingDate: "2026-02-01" },
    };
    expect(collectReadyForReviewIssues(withInspection, CREATED_AT)).toContain("Inspection deadline should be on or before the closing date.");
  });

  it("flags an invalid buyer email format", () => {
    const parsed = contractFormDataSchema.parse(complete());
    const badEmail = { ...parsed, buyer: { ...parsed.buyer, email: "not-an-email" } };
    expect(collectReadyForReviewIssues(badEmail, CREATED_AT)).toContain("Buyer email address doesn't look valid.");
  });

  it("does not flag email/phone when left blank — only when filled with something invalid", () => {
    const parsed = contractFormDataSchema.parse(complete());
    expect(collectReadyForReviewIssues(parsed, CREATED_AT).some((i) => i.includes("email"))).toBe(false);
  });

  it("requires explicit assignment confirmation when the assignment section is present", () => {
    const parsed = contractFormDataSchema.parse(complete());
    const withAssignment = {
      ...parsed,
      assignment: { includeAssignmentClause: false, assignable: null, buyerMayNominate: false, assignmentFeeExcludedFromContract: false, includeDoubleClosingNote: false },
    };
    const issues = collectReadyForReviewIssues(withAssignment, CREATED_AT);
    expect(issues.some((i) => i.includes("assignable"))).toBe(true);
    expect(issues.some((i) => i.includes("assignment clause"))).toBe(true);
  });

  it("passes once assignment is explicitly confirmed", () => {
    const parsed = contractFormDataSchema.parse(complete());
    const withAssignment = {
      ...parsed,
      assignment: { includeAssignmentClause: true, assignable: true, buyerMayNominate: false, assignmentFeeExcludedFromContract: true, includeDoubleClosingNote: false },
    };
    expect(collectReadyForReviewIssues(withAssignment, CREATED_AT)).toEqual([]);
  });
});

describe("collectAdvisoryWarnings", () => {
  it("warns about a missing legal description without blocking anything", () => {
    const parsed = contractFormDataSchema.parse(complete());
    const warnings = collectAdvisoryWarnings(parsed);
    expect(warnings.some((w) => w.includes("legal description"))).toBe(true);
    // A complete-enough contract has zero *blocking* issues even though it has warnings.
    expect(collectReadyForReviewIssues(parsed, CREATED_AT)).toEqual([]);
  });

  it("has no warnings once county, parcel, and legal description are filled in", () => {
    const data = complete();
    data.property.county = "Travis";
    data.property.parcelNumber = "12-3456-789";
    data.property.legalDescription = "Lot 1, Block 2, Example Subdivision";
    const parsed = contractFormDataSchema.parse(data);
    expect(collectAdvisoryWarnings(parsed)).toEqual([]);
  });
});
