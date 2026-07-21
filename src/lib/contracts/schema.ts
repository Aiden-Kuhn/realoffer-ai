import { z } from "zod";
import { CONTRACT_STATUSES, FINANCING_TYPES, PROPERTY_CONDITIONS, PURCHASE_PRICE_SOURCES } from "@/lib/contracts/types";

/**
 * Two tiers, matching "don't block a draft, only block Ready for Review /
 * export":
 *   - contractFormDataSchema: shape + length/format validation only. This is
 *     what every autosave is checked against — it exists to keep stored
 *     data well-typed and bounded (XSS/abuse defense via length caps), not
 *     to enforce business completeness. Everything here is optional/blank-
 *     able.
 *   - readyForReviewRefinements: cross-field business rules (required
 *     parties, price > 0, logical dates, etc.) layered on top via
 *     `.superRefine`, applied only when transitioning to "ready_for_review"
 *     or exporting a PDF.
 */

const SHORT_TEXT_MAX = 200;
const ADDRESS_MAX = 300;
const LONG_TEXT_MAX = 5000;

const shortText = z.string().max(SHORT_TEXT_MAX).default("");
const addressText = z.string().max(ADDRESS_MAX).default("");
const longText = z.string().max(LONG_TEXT_MAX).default("");
const stateCode = z.string().max(2).default("");
const zipCode = z.string().max(10).default("");

// Loose on purpose — validated for *format*, not deliverability, and only
// enforced at all when the field is non-empty (see refinements below).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s\-().+]{7,20}$/;

const partySchema = z.object({
  legalName: shortText,
  entityName: shortText,
  mailingAddressLine1: addressText,
  mailingCity: shortText,
  mailingState: stateCode,
  mailingZip: zipCode,
  email: shortText,
  phone: shortText,
});

const propertySectionSchema = z.object({
  addressLine1: addressText,
  city: shortText,
  state: stateCode,
  zip: zipCode,
  county: shortText,
  parcelNumber: shortText,
  legalDescription: longText,
  propertyType: shortText,
  includedPersonalProperty: longText,
  excludedItems: longText,
});

const nonNegativeCentsOrNull = z.number().int().min(0).max(1_000_000_000_00).nullable().default(null);
const isoDateOrNull = z.string().max(32).nullable().default(null);
const positiveDaysOrNull = z.number().int().min(0).max(3650).nullable().default(null);

const purchaseTermsSchema = z.object({
  purchasePriceCents: nonNegativeCentsOrNull,
  purchasePriceSource: z.enum(PURCHASE_PRICE_SOURCES).nullable().default(null),
  earnestMoneyCents: nonNegativeCentsOrNull,
  earnestMoneyDueDate: isoDateOrNull,
  financingType: z.enum(FINANCING_TYPES).nullable().default(null),
  financingContingency: z.boolean().default(false),
  appraisalContingency: z.boolean().default(false),
  closingDate: isoDateOrNull,
  closingCompanyOrAttorney: shortText,
  closingCostAllocation: longText,
  prorationSettings: longText,
  possessionDate: isoDateOrNull,
});

const dueDiligenceSchema = z.object({
  inspectionPeriodDays: positiveDaysOrNull,
  inspectionDeadline: isoDateOrNull,
  inspectionDeadlineManuallySet: z.boolean().default(false),
  rightToTerminateDuringInspection: z.boolean().default(false),
  propertyAccessTerms: longText,
  titleReviewPeriodDays: positiveDaysOrNull,
  surveyRequired: z.boolean().default(false),
  propertyCondition: z.enum(PROPERTY_CONDITIONS).nullable().default(null),
  requiredSellerDisclosures: longText,
  dueDiligenceNotes: longText,
});

const assignmentSectionSchema = z
  .object({
    includeAssignmentClause: z.boolean().default(false),
    assignable: z.boolean().nullable().default(null),
    buyerMayNominate: z.boolean().default(false),
    assignmentFeeExcludedFromContract: z.boolean().default(false),
    includeDoubleClosingNote: z.boolean().default(false),
  })
  .nullable()
  .default(null);

const additionalTermsSchema = z.object({
  accessBeforeClosing: longText,
  existingTenantOrLease: longText,
  utilities: longText,
  repairsOrCredits: longText,
  personalPropertyNotes: longText,
  specialStipulations: longText,
  otherTerms: longText,
});

export const contractFormDataSchema = z.object({
  property: propertySectionSchema,
  buyer: partySchema,
  additionalBuyers: z.array(partySchema).max(6).default([]),
  seller: partySchema,
  additionalSellers: z.array(partySchema).max(6).default([]),
  purchaseTerms: purchaseTermsSchema,
  dueDiligence: dueDiligenceSchema,
  assignment: assignmentSectionSchema,
  additionalTerms: additionalTermsSchema,
});

export type ContractFormDataInput = z.input<typeof contractFormDataSchema>;

export const contractStatusSchema = z.enum(CONTRACT_STATUSES);

export const jurisdictionStateSchema = z.string().trim().length(2).nullable();

/** One reusable issue-collector so both "ready for review" and "export"
 * gates report the exact same missing/invalid fields. */
export function collectReadyForReviewIssues(formData: z.infer<typeof contractFormDataSchema>, contractCreatedAt: string): string[] {
  const issues: string[] = [];

  if (!formData.buyer.legalName.trim()) issues.push("Buyer legal name is required.");
  if (!formData.seller.legalName.trim()) issues.push("Seller legal name is required.");
  if (!formData.property.addressLine1.trim()) issues.push("Property address is required.");
  if (!formData.property.city.trim()) issues.push("Property city is required.");
  if (!formData.property.state.trim()) issues.push("Property state is required.");
  if (!formData.property.zip.trim()) issues.push("Property ZIP code is required.");

  if (formData.purchaseTerms.purchasePriceCents === null || formData.purchaseTerms.purchasePriceCents <= 0) {
    issues.push("Purchase price must be greater than zero.");
  }
  if (formData.purchaseTerms.purchasePriceCents !== null && formData.purchaseTerms.purchasePriceSource === null) {
    issues.push("Confirm which price you're using (proposed, suggested, maximum, or custom) before continuing.");
  }
  if (formData.purchaseTerms.earnestMoneyCents !== null && formData.purchaseTerms.earnestMoneyCents < 0) {
    issues.push("Earnest money cannot be negative.");
  }

  const created = new Date(contractCreatedAt).getTime();
  if (formData.purchaseTerms.closingDate) {
    const closing = new Date(formData.purchaseTerms.closingDate).getTime();
    if (Number.isNaN(closing)) {
      issues.push("Closing date is not a valid date.");
    } else if (!Number.isNaN(created) && closing < created) {
      issues.push("Closing date must be on or after the contract date.");
    }
  } else {
    issues.push("Closing date is required.");
  }

  if (formData.dueDiligence.inspectionDeadline && formData.purchaseTerms.closingDate) {
    const inspection = new Date(formData.dueDiligence.inspectionDeadline).getTime();
    const closing = new Date(formData.purchaseTerms.closingDate).getTime();
    if (!Number.isNaN(inspection) && !Number.isNaN(closing) && inspection > closing) {
      issues.push("Inspection deadline should be on or before the closing date.");
    }
  }

  for (const [label, party] of [
    ["Buyer", formData.buyer],
    ["Seller", formData.seller],
  ] as const) {
    if (party.email.trim() && !EMAIL_RE.test(party.email.trim())) issues.push(`${label} email address doesn't look valid.`);
    if (party.phone.trim() && !PHONE_RE.test(party.phone.trim())) issues.push(`${label} phone number doesn't look valid.`);
  }

  if (formData.assignment && formData.assignment.assignable === null) {
    issues.push("Choose whether this agreement is assignable before continuing.");
  }
  if (formData.assignment && !formData.assignment.includeAssignmentClause) {
    issues.push("Confirm you want to include the assignment clause, or remove the assignment section.");
  }

  return issues;
}

/** Non-blocking — shown as advisory warnings, never prevents saving a
 * draft, moving to Ready for Review, or exporting a PDF. */
export function collectAdvisoryWarnings(formData: z.infer<typeof contractFormDataSchema>): string[] {
  const warnings: string[] = [];
  if (!formData.property.legalDescription.trim()) {
    warnings.push("No legal description was entered. Many jurisdictions expect one on a purchase agreement — confirm with your attorney whether it's required here.");
  }
  if (!formData.property.county.trim()) {
    warnings.push("Property county wasn't entered.");
  }
  if (!formData.property.parcelNumber.trim()) {
    warnings.push("Parcel/APN number wasn't entered.");
  }
  return warnings;
}
