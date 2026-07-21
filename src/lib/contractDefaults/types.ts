import type { PropertyConditionOption } from "@/lib/contracts/types";

/**
 * Saved account-level defaults for the Due Diligence section of a purchase
 * agreement. Deliberately excludes "required seller disclosures" and the
 * inspection deadline itself — disclosures vary by property/seller/state
 * so they're always deal-specific, and the deadline is *calculated* from
 * an effective date + period, not a stored preference (see
 * lib/contracts/inspectionDeadline.ts).
 *
 * This is the "due_diligence" category of the `contract_defaults` table —
 * a future milestone can add "closing"/"financing"/"earnest_money"/
 * "assignment" categories alongside it with no migration, just a new
 * category string and a new values shape like this one.
 */
export type DueDiligenceDefaultsValues = {
  inspectionPeriodDays: number | null;
  titleReviewPeriodDays: number | null;
  rightToTerminateDuringInspection: boolean;
  surveyRequired: boolean;
  propertyCondition: PropertyConditionOption | null;
  propertyAccessTerms: string;
  dueDiligenceNotes: string;
};

export type DueDiligenceDefaults = {
  id: string;
  userId: string;
  category: "due_diligence";
  values: DueDiligenceDefaultsValues;
  createdAt: string;
  updatedAt: string;
};

export function emptyDueDiligenceDefaultsValues(): DueDiligenceDefaultsValues {
  return {
    inspectionPeriodDays: null,
    titleReviewPeriodDays: null,
    rightToTerminateDuringInspection: false,
    surveyRequired: false,
    propertyCondition: null,
    propertyAccessTerms: "",
    dueDiligenceNotes: "",
  };
}
