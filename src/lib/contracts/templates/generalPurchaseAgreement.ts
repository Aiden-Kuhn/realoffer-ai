import { PROPERTY_TYPE_LABELS } from "@/lib/property/labels";
import { emptyParty, type ContractFormData } from "@/lib/contracts/types";
import type { Deal } from "@/types/deal";
import type { AppSettings } from "@/lib/repositories/settingsRepository";

/**
 * The one template this milestone ships with — deliberately generic, not
 * tied to any state's specific legal requirements. Selecting a state in the
 * builder only changes the disclaimer shown (see JURISDICTION_DISCLAIMER
 * below); it never changes which clauses render, because no attorney-
 * reviewed state-specific template exists yet. See
 * lib/contracts/templates/README (this comment) for how to add one: create
 * a sibling file exporting the same shape with a new templateId/version,
 * register it in the TEMPLATES map, and it becomes selectable without
 * touching any other template's contracts.
 */
export const GENERAL_PURCHASE_AGREEMENT_TEMPLATE_ID = "general_purchase_agreement";
export const GENERAL_PURCHASE_AGREEMENT_TEMPLATE_VERSION = "1.0.0";

export const GENERAL_TEMPLATE_LABEL = "General Purchase Agreement (Draft Template)";

export const GENERAL_TEMPLATE_DISCLAIMER =
  "This is a general-purpose draft template, not a state-specific legal form. RealOffer AI is not a law firm and does not provide legal advice. " +
  "This document is for informational and drafting purposes only. Have a licensed real estate attorney or other qualified professional in your " +
  "jurisdiction review this agreement before you rely on it or ask anyone to sign it.";

export function emptyContractFormData(): ContractFormData {
  return {
    property: {
      addressLine1: "",
      city: "",
      state: "",
      zip: "",
      county: "",
      parcelNumber: "",
      legalDescription: "",
      propertyType: "",
      includedPersonalProperty: "",
      excludedItems: "",
    },
    buyer: emptyParty(),
    additionalBuyers: [],
    seller: emptyParty(),
    additionalSellers: [],
    purchaseTerms: {
      purchasePriceCents: null,
      purchasePriceSource: null,
      earnestMoneyCents: null,
      earnestMoneyDueDate: null,
      financingType: null,
      financingContingency: false,
      appraisalContingency: false,
      closingDate: null,
      closingCompanyOrAttorney: "",
      closingCostAllocation: "",
      prorationSettings: "",
      possessionDate: null,
    },
    dueDiligence: {
      inspectionPeriodDays: null,
      inspectionDeadline: null,
      rightToTerminateDuringInspection: false,
      propertyAccessTerms: "",
      titleReviewPeriodDays: null,
      surveyRequired: false,
      propertyCondition: null,
      requiredSellerDisclosures: "",
      dueDiligenceNotes: "",
    },
    assignment: null,
    additionalTerms: {
      accessBeforeClosing: "",
      existingTenantOrLease: "",
      utilities: "",
      repairsOrCredits: "",
      personalPropertyNotes: "",
      specialStipulations: "",
      otherTerms: "",
    },
  };
}

/**
 * Prefills only the fields RealOffer AI actually trusts — property address/
 * type/county from the analyzed deal, buyer identity/contact from the
 * user's saved profile, and the purchase price ONLY as a suggestion (never
 * silently confirmed — purchasePriceSource records which figure was offered,
 * but the builder must still make the user explicitly confirm it). Seller
 * info, parcel number, legal description, closing company, and every date
 * are left blank — RealOffer AI has no trusted source for any of them.
 *
 * Defaults the purchase price to the deal's proposed contract price (a
 * number the user already entered during deal analysis, not an AI figure).
 * The offer-price choice step (suggested opening / maximum recommended /
 * custom) is a separate, explicit UI control in the builder — see
 * PurchasePriceStep — not applied here, so switching price sources is
 * always a deliberate action, never a silent default.
 */
export function buildPrefillFromDeal(deal: Deal, buyerProfile: AppSettings): ContractFormData {
  const base = emptyContractFormData();

  base.property.addressLine1 = deal.property.address.line1;
  base.property.city = deal.property.address.city;
  base.property.state = deal.property.address.state;
  base.property.zip = deal.property.address.zip;
  base.property.county = deal.property.county ?? "";
  base.property.propertyType = PROPERTY_TYPE_LABELS[deal.property.propertyType];

  base.buyer.legalName = buyerProfile.fullName;
  base.buyer.entityName = buyerProfile.companyName;
  base.buyer.mailingAddressLine1 = buyerProfile.mailingAddressLine1;
  base.buyer.mailingCity = buyerProfile.mailingCity;
  base.buyer.mailingState = buyerProfile.mailingState;
  base.buyer.mailingZip = buyerProfile.mailingZip;
  base.buyer.phone = buyerProfile.phone;
  // Buyer email intentionally left for the caller to fill from the
  // authenticated user's auth.users email (not part of AppSettings).

  base.purchaseTerms.purchasePriceCents = deal.assumptions.contractPriceCents > 0 ? deal.assumptions.contractPriceCents : null;
  base.purchaseTerms.purchasePriceSource = base.purchaseTerms.purchasePriceCents !== null ? "proposed_contract_price" : null;
  base.purchaseTerms.earnestMoneyDueDate = null;

  return base;
}
