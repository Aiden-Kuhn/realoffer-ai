import { describe, expect, it } from "vitest";
import { buildPrefillFromDeal } from "@/lib/contracts/templates/generalPurchaseAgreement";
import { emptyParty } from "@/lib/contracts/types";
import { makeStrongDealFixtures } from "@/tests/investmentAnalysis/fixtures";
import type { Deal } from "@/types/deal";

function makeDeal(overrides: Partial<Deal> = {}): Deal {
  const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
  return {
    id: "deal-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    status: "draft",
    notes: "",
    property,
    comparables,
    assumptions,
    repairEstimate,
    results,
    dataMode: "demo",
    ...overrides,
  };
}

describe("buildPrefillFromDeal — Buyer Profile prefill", () => {
  it("leaves the buyer section entirely blank for a first-time user with no profile", () => {
    const formData = buildPrefillFromDeal(makeDeal(), null);
    expect(formData.buyer).toEqual(emptyParty());
  });

  it("prefills every buyer field from an existing profile", () => {
    const profile = {
      legalName: "Jamie Rivera",
      entityName: "Rivera Capital LLC",
      mailingAddressLine1: "123 Main St",
      mailingCity: "Austin",
      mailingState: "TX",
      mailingZip: "78701",
      email: "jamie@example.com",
      phone: "512-555-0100",
    };
    const formData = buildPrefillFromDeal(makeDeal(), profile);
    expect(formData.buyer).toEqual(profile);
  });

  it("never populates the seller section, regardless of whether a buyer profile exists", () => {
    const profile = { ...emptyParty(), legalName: "Jamie Rivera" };
    const withProfile = buildPrefillFromDeal(makeDeal(), profile);
    const withoutProfile = buildPrefillFromDeal(makeDeal(), null);
    expect(withProfile.seller).toEqual(emptyParty());
    expect(withoutProfile.seller).toEqual(emptyParty());
  });

  it("still prefills property fields from the deal when there's no buyer profile", () => {
    const deal = makeDeal();
    const formData = buildPrefillFromDeal(deal, null);
    expect(formData.property.addressLine1).toBe(deal.property.address.line1);
    expect(formData.property.city).toBe(deal.property.address.city);
    expect(formData.property.state).toBe(deal.property.address.state);
  });

  it("prefills the proposed contract price from the deal's assumptions", () => {
    const deal = makeDeal();
    const formData = buildPrefillFromDeal(deal, null);
    expect(formData.purchaseTerms.purchasePriceCents).toBe(deal.assumptions.contractPriceCents);
    expect(formData.purchaseTerms.purchasePriceSource).toBe("proposed_contract_price");
  });

  it("leaves the purchase price unset when the deal has no contract price", () => {
    const deal = makeDeal({ assumptions: { ...makeDeal().assumptions, contractPriceCents: 0 } });
    const formData = buildPrefillFromDeal(deal, null);
    expect(formData.purchaseTerms.purchasePriceCents).toBeNull();
    expect(formData.purchaseTerms.purchasePriceSource).toBeNull();
  });
});

describe("buildPrefillFromDeal — Due Diligence defaults prefill", () => {
  it("leaves the due-diligence section entirely blank for a first-time user with no saved defaults", () => {
    const formData = buildPrefillFromDeal(makeDeal(), null, null);
    expect(formData.dueDiligence.inspectionPeriodDays).toBeNull();
    expect(formData.dueDiligence.titleReviewPeriodDays).toBeNull();
    expect(formData.dueDiligence.propertyCondition).toBeNull();
    expect(formData.dueDiligence.propertyAccessTerms).toBe("");
    expect(formData.dueDiligence.dueDiligenceNotes).toBe("");
    expect(formData.dueDiligence.inspectionDeadline).toBeNull();
  });

  it("prefills every default field except required seller disclosures", () => {
    const defaults = {
      inspectionPeriodDays: 10,
      titleReviewPeriodDays: 14,
      rightToTerminateDuringInspection: true,
      surveyRequired: true,
      propertyCondition: "as_is" as const,
      propertyAccessTerms: "Business hours only",
      dueDiligenceNotes: "Confirm HOA docs on file",
    };
    const formData = buildPrefillFromDeal(makeDeal(), null, defaults);
    expect(formData.dueDiligence.inspectionPeriodDays).toBe(10);
    expect(formData.dueDiligence.titleReviewPeriodDays).toBe(14);
    expect(formData.dueDiligence.rightToTerminateDuringInspection).toBe(true);
    expect(formData.dueDiligence.surveyRequired).toBe(true);
    expect(formData.dueDiligence.propertyCondition).toBe("as_is");
    expect(formData.dueDiligence.propertyAccessTerms).toBe("Business hours only");
    expect(formData.dueDiligence.dueDiligenceNotes).toBe("Confirm HOA docs on file");
    // Never a default — always deal-specific.
    expect(formData.dueDiligence.requiredSellerDisclosures).toBe("");
  });

  it("computes an automatically-calculated inspection deadline when a period default exists", () => {
    const defaults = { inspectionPeriodDays: 10, titleReviewPeriodDays: null, rightToTerminateDuringInspection: false, surveyRequired: false, propertyCondition: null, propertyAccessTerms: "", dueDiligenceNotes: "" };
    const formData = buildPrefillFromDeal(makeDeal(), null, defaults);
    expect(formData.dueDiligence.inspectionDeadline).not.toBeNull();
    expect(formData.dueDiligence.inspectionDeadlineManuallySet).toBe(false);
  });

  it("leaves the inspection deadline null when the defaults have no period", () => {
    const defaults = { inspectionPeriodDays: null, titleReviewPeriodDays: 14, rightToTerminateDuringInspection: false, surveyRequired: false, propertyCondition: null, propertyAccessTerms: "", dueDiligenceNotes: "" };
    const formData = buildPrefillFromDeal(makeDeal(), null, defaults);
    expect(formData.dueDiligence.inspectionDeadline).toBeNull();
  });
});
