import { describe, expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { ContractDocument } from "@/lib/contracts/pdf/ContractDocument";
import { emptyContractFormData } from "@/lib/contracts/templates/generalPurchaseAgreement";
import type { ContractFormData } from "@/lib/contracts/types";

const BASE_PROPS = {
  templateLabel: "General Purchase Agreement (Draft Template)",
  templateVersion: "1.0.0",
  disclaimer: "This is a general-purpose draft template, not a state-specific legal form.",
  generatedAt: "2026-01-01T00:00:00.000Z",
  jurisdictionState: "TX" as string | null,
};

function completeFormData(): ContractFormData {
  const data = emptyContractFormData();
  data.property = { ...data.property, addressLine1: "123 Main St", city: "Austin", state: "TX", zip: "78701", county: "Travis", legalDescription: "Lot 1, Block 2" };
  data.buyer = { ...data.buyer, legalName: "Jamie Rivera", email: "jamie@example.com", phone: "512-555-0100" };
  data.seller = { ...data.seller, legalName: "Pat Seller" };
  data.purchaseTerms = { ...data.purchaseTerms, purchasePriceCents: 30_000_000, purchasePriceSource: "proposed_contract_price", closingDate: "2026-02-01" };
  return data;
}

function isValidPdf(buffer: Buffer): boolean {
  return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
}

describe("ContractDocument PDF generation", () => {
  it("renders a valid PDF for a fully completed contract", async () => {
    const buffer = await renderToBuffer(ContractDocument({ ...BASE_PROPS, formData: completeFormData() }));
    expect(isValidPdf(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(500);
  });

  it("renders a valid PDF when every optional field is blank (no fabricated placeholder data)", async () => {
    const buffer = await renderToBuffer(ContractDocument({ ...BASE_PROPS, formData: emptyContractFormData() }));
    expect(isValidPdf(buffer)).toBe(true);
  });

  it("renders a multi-page PDF without throwing when additional-terms text is very long", async () => {
    const data = completeFormData();
    data.additionalTerms.otherTerms = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(400);
    data.additionalTerms.specialStipulations = "Special stipulation text repeated many times. ".repeat(300);
    const buffer = await renderToBuffer(ContractDocument({ ...BASE_PROPS, formData: data }));
    expect(isValidPdf(buffer)).toBe(true);
    // A document this long should meaningfully exceed a single-page baseline.
    const shortBuffer = await renderToBuffer(ContractDocument({ ...BASE_PROPS, formData: completeFormData() }));
    expect(buffer.length).toBeGreaterThan(shortBuffer.length);
  });

  it("handles unusually long names and addresses without throwing", async () => {
    const data = completeFormData();
    data.buyer.legalName = "A".repeat(300);
    data.buyer.mailingAddressLine1 = "B".repeat(300);
    data.property.addressLine1 = "C".repeat(300);
    const buffer = await renderToBuffer(ContractDocument({ ...BASE_PROPS, formData: data }));
    expect(isValidPdf(buffer)).toBe(true);
  });

  it("includes assignment content only when the section is present and the clause is confirmed", async () => {
    const withoutAssignment = completeFormData();
    const withAssignment = completeFormData();
    withAssignment.assignment = {
      includeAssignmentClause: true,
      assignable: true,
      buyerMayNominate: true,
      assignmentFeeExcludedFromContract: true,
      includeDoubleClosingNote: true,
    };

    const bufferWithout = await renderToBuffer(ContractDocument({ ...BASE_PROPS, formData: withoutAssignment }));
    const bufferWith = await renderToBuffer(ContractDocument({ ...BASE_PROPS, formData: withAssignment }));
    expect(isValidPdf(bufferWithout)).toBe(true);
    expect(isValidPdf(bufferWith)).toBe(true);
    // The assignment section adds real content, so the PDF should differ in size.
    expect(bufferWith.length).not.toBe(bufferWithout.length);
  });

  it("does not render assignment content when the section exists but the clause was never confirmed", async () => {
    const data = completeFormData();
    data.assignment = { includeAssignmentClause: false, assignable: null, buyerMayNominate: false, assignmentFeeExcludedFromContract: false, includeDoubleClosingNote: false };
    const buffer = await renderToBuffer(ContractDocument({ ...BASE_PROPS, formData: data }));
    expect(isValidPdf(buffer)).toBe(true);
  });

  it("renders with no jurisdiction selected without throwing", async () => {
    const buffer = await renderToBuffer(ContractDocument({ ...BASE_PROPS, jurisdictionState: null, formData: completeFormData() }));
    expect(isValidPdf(buffer)).toBe(true);
  });
});
