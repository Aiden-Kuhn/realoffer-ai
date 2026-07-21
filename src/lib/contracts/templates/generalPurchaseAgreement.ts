import { PROPERTY_TYPE_LABELS } from "@/lib/property/labels";
import { emptyParty, type ContractFormData, type PartyInfo } from "@/lib/contracts/types";
import { calculateInspectionDeadline } from "@/lib/contracts/inspectionDeadline";
import { resolveEffectiveBedsBaths } from "@/lib/property/bedsBathsOverride";
import type { DueDiligenceDefaultsValues } from "@/lib/contractDefaults/types";
import type { Deal } from "@/types/deal";

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
      bedrooms: null,
      bathrooms: null,
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
      inspectionDeadlineManuallySet: false,
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
 * type/county/bedrooms/bathrooms from the analyzed deal (bedrooms/bathrooms
 * use the deal's *effective* value — the user's correction if one exists,
 * else the provider's, see lib/property/bedsBathsOverride.ts — so a
 * correction never has to be re-entered here), buyer identity/contact from the
 * user's saved Buyer Profile (see lib/buyerProfile/), and the purchase
 * price ONLY as a suggestion (never silently confirmed —
 * purchasePriceSource records which figure was offered, but the builder
 * must still make the user explicitly confirm it). Seller info, parcel
 * number, legal description, closing company, and every date are left
 * blank — RealOffer AI has no trusted source for any of them, and seller
 * data is never copied from or into the buyer profile.
 *
 * `buyerProfile` is null for a first-time user with no saved profile yet —
 * the buyer section is simply left blank in that case, same as seller.
 *
 * `dueDiligenceDefaults` is null for a user with no saved defaults — the
 * Due Diligence section is simply left blank in that case. Required seller
 * disclosures are never populated from defaults (there is no such default —
 * see lib/contractDefaults/types.ts). When an inspection period default is
 * present, the deadline is computed immediately from *today* (this
 * contract's about-to-be `created_at`) so a brand-new contract starts with
 * a real, correctly-labeled "automatically calculated" deadline rather
 * than a blank one — `inspectionDeadlineManuallySet` stays false, so the
 * builder keeps recalculating it if the period changes before the user
 * types over it directly.
 *
 * Defaults the purchase price to the deal's proposed contract price (a
 * number the user already entered during deal analysis, not an AI figure).
 * The offer-price choice step (suggested opening / maximum recommended /
 * custom) is a separate, explicit UI control in the builder — see
 * PurchasePriceStep — not applied here, so switching price sources is
 * always a deliberate action, never a silent default.
 */
export function buildPrefillFromDeal(deal: Deal, buyerProfile: PartyInfo | null, dueDiligenceDefaults: DueDiligenceDefaultsValues | null = null): ContractFormData {
  const base = emptyContractFormData();

  base.property.addressLine1 = deal.property.address.line1;
  base.property.city = deal.property.address.city;
  base.property.state = deal.property.address.state;
  base.property.zip = deal.property.address.zip;
  base.property.county = deal.property.county ?? "";
  base.property.propertyType = PROPERTY_TYPE_LABELS[deal.property.propertyType];
  const effectiveBedsBaths = resolveEffectiveBedsBaths(deal);
  base.property.bedrooms = effectiveBedsBaths.bedrooms;
  base.property.bathrooms = effectiveBedsBaths.bathrooms;

  if (buyerProfile) {
    base.buyer.legalName = buyerProfile.legalName;
    base.buyer.entityName = buyerProfile.entityName;
    base.buyer.mailingAddressLine1 = buyerProfile.mailingAddressLine1;
    base.buyer.mailingCity = buyerProfile.mailingCity;
    base.buyer.mailingState = buyerProfile.mailingState;
    base.buyer.mailingZip = buyerProfile.mailingZip;
    base.buyer.email = buyerProfile.email;
    base.buyer.phone = buyerProfile.phone;
  }

  base.purchaseTerms.purchasePriceCents = deal.assumptions.contractPriceCents > 0 ? deal.assumptions.contractPriceCents : null;
  base.purchaseTerms.purchasePriceSource = base.purchaseTerms.purchasePriceCents !== null ? "proposed_contract_price" : null;
  base.purchaseTerms.earnestMoneyDueDate = null;

  if (dueDiligenceDefaults) {
    base.dueDiligence.inspectionPeriodDays = dueDiligenceDefaults.inspectionPeriodDays;
    base.dueDiligence.titleReviewPeriodDays = dueDiligenceDefaults.titleReviewPeriodDays;
    base.dueDiligence.rightToTerminateDuringInspection = dueDiligenceDefaults.rightToTerminateDuringInspection;
    base.dueDiligence.surveyRequired = dueDiligenceDefaults.surveyRequired;
    base.dueDiligence.propertyCondition = dueDiligenceDefaults.propertyCondition;
    base.dueDiligence.propertyAccessTerms = dueDiligenceDefaults.propertyAccessTerms;
    base.dueDiligence.dueDiligenceNotes = dueDiligenceDefaults.dueDiligenceNotes;
    base.dueDiligence.inspectionDeadline = calculateInspectionDeadline(new Date().toISOString(), dueDiligenceDefaults.inspectionPeriodDays);
    base.dueDiligence.inspectionDeadlineManuallySet = false;
  }

  return base;
}
