/**
 * Structured contract data model. Every monetary value is integer cents,
 * every date is an ISO "YYYY-MM-DD" string, matching the conventions used
 * throughout lib/calculations and types/deal.ts. Nothing here is ever
 * auto-generated legal prose — this is data that a template (see
 * lib/contracts/templates/) renders into fixed, versioned document text.
 */

export const CONTRACT_STATUSES = ["draft", "ready_for_review", "exported", "archived"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: "Draft",
  ready_for_review: "Ready for Review",
  exported: "Exported",
  archived: "Archived",
};

export type PartyInfo = {
  legalName: string;
  /** Entity name (e.g. an LLC) purchasing/selling in place of or alongside
   * the individual — blank means "no entity, individual only." */
  entityName: string;
  mailingAddressLine1: string;
  mailingCity: string;
  mailingState: string;
  mailingZip: string;
  email: string;
  phone: string;
};

export function emptyParty(): PartyInfo {
  return { legalName: "", entityName: "", mailingAddressLine1: "", mailingCity: "", mailingState: "", mailingZip: "", email: "", phone: "" };
}

export type PropertySection = {
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  /** Never auto-filled — no trusted source for this in the app today. */
  county: string;
  /** Never auto-filled — no trusted source for this in the app today. */
  parcelNumber: string;
  /** Only ever set by explicit user entry — never inferred or guessed. */
  legalDescription: string;
  propertyType: string;
  includedPersonalProperty: string;
  excludedItems: string;
};

export const PURCHASE_PRICE_SOURCES = ["proposed_contract_price", "suggested_opening_offer", "maximum_recommended_offer", "custom"] as const;
export type PurchasePriceSource = (typeof PURCHASE_PRICE_SOURCES)[number];

export const FINANCING_TYPES = ["cash", "conventional", "fha", "va", "seller_financing", "other"] as const;
export type FinancingType = (typeof FINANCING_TYPES)[number];

export type PurchaseTermsSection = {
  purchasePriceCents: number | null;
  /** Which price the user picked before typing/confirming purchasePriceCents
   * — required so the UI can show "you selected the suggested opening offer"
   * rather than a bare number with no context. Purely informational; the
   * actual binding number is always purchasePriceCents. */
  purchasePriceSource: PurchasePriceSource | null;
  earnestMoneyCents: number | null;
  earnestMoneyDueDate: string | null;
  financingType: FinancingType | null;
  financingContingency: boolean;
  appraisalContingency: boolean;
  closingDate: string | null;
  closingCompanyOrAttorney: string;
  closingCostAllocation: string;
  prorationSettings: string;
  possessionDate: string | null;
};

export const PROPERTY_CONDITIONS = ["as_is", "seller_to_repair", "other"] as const;
export type PropertyConditionOption = (typeof PROPERTY_CONDITIONS)[number];

export type DueDiligenceSection = {
  inspectionPeriodDays: number | null;
  inspectionDeadline: string | null;
  /** True once the user has typed directly into the deadline field —
   * from then on, changing the inspection period or effective date no
   * longer silently recomputes it (see lib/contracts/inspectionDeadline.ts).
   * Clicking "Recalculate" clears this back to false. */
  inspectionDeadlineManuallySet: boolean;
  rightToTerminateDuringInspection: boolean;
  propertyAccessTerms: string;
  titleReviewPeriodDays: number | null;
  surveyRequired: boolean;
  propertyCondition: PropertyConditionOption | null;
  requiredSellerDisclosures: string;
  dueDiligenceNotes: string;
};

/**
 * Present only when the user explicitly opts into a wholesale/investor
 * workflow — never assumed. `includeAssignmentClause` is the explicit
 * confirmation gate: even with this section visible, the assignment clause
 * itself is only written into the document when this is true.
 */
export type AssignmentSection = {
  includeAssignmentClause: boolean;
  assignable: boolean | null;
  buyerMayNominate: boolean;
  assignmentFeeExcludedFromContract: boolean;
  includeDoubleClosingNote: boolean;
};

export type AdditionalTermsSection = {
  accessBeforeClosing: string;
  existingTenantOrLease: string;
  utilities: string;
  repairsOrCredits: string;
  personalPropertyNotes: string;
  specialStipulations: string;
  otherTerms: string;
};

export type ContractFormData = {
  property: PropertySection;
  buyer: PartyInfo;
  additionalBuyers: PartyInfo[];
  seller: PartyInfo;
  additionalSellers: PartyInfo[];
  purchaseTerms: PurchaseTermsSection;
  dueDiligence: DueDiligenceSection;
  /** null = section not shown (default) — see AssignmentSection doc above. */
  assignment: AssignmentSection | null;
  additionalTerms: AdditionalTermsSection;
};

export type Contract = {
  id: string;
  userId: string;
  dealId: string;
  templateId: string;
  templateVersion: string;
  jurisdictionState: string | null;
  status: ContractStatus;
  formData: ContractFormData;
  /** Frozen structured document data captured at export time — set on
   * first export, refreshed on every subsequent export. Null until then. */
  documentSnapshot: ContractFormData | null;
  createdAt: string;
  updatedAt: string;
};
