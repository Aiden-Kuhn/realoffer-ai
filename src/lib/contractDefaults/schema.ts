import { z } from "zod";
import { PROPERTY_CONDITIONS } from "@/lib/contracts/types";

/**
 * One lenient schema, same philosophy as buyerProfileSchema — every field
 * is optional/blankable so a partial draft always saves cleanly ("do not
 * block saving a contract merely because optional defaults are
 * incomplete"). Day bounds match lib/contracts/schema.ts's
 * `positiveDaysOrNull` exactly, and propertyCondition is constrained to the
 * same controlled enum the contract builder's select field uses — never
 * free text standing in for a legal term.
 */

const LONG_TEXT_MAX = 5000;
const longText = z.string().max(LONG_TEXT_MAX, "That's too long.").default("");
const positiveDaysOrNull = z.number().int().min(0, "Cannot be negative.").max(3650, "Enter a smaller number of days.").nullable().default(null);

export const dueDiligenceDefaultsValuesSchema = z.object({
  inspectionPeriodDays: positiveDaysOrNull,
  titleReviewPeriodDays: positiveDaysOrNull,
  rightToTerminateDuringInspection: z.boolean().default(false),
  surveyRequired: z.boolean().default(false),
  propertyCondition: z.enum(PROPERTY_CONDITIONS).nullable().default(null),
  propertyAccessTerms: longText,
  dueDiligenceNotes: longText,
});

/** Output type (after zod defaults) — what save() receives. */
export type DueDiligenceDefaultsFormValues = z.infer<typeof dueDiligenceDefaultsValuesSchema>;
/** Input type (before defaults) — what useForm's TFieldValues generic needs. */
export type DueDiligenceDefaultsFormInput = z.input<typeof dueDiligenceDefaultsValuesSchema>;
