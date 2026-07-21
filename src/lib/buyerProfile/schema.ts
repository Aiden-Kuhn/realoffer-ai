import { z } from "zod";

/**
 * One lenient schema — a buyer profile has no separate "ready" state like a
 * contract does, so there's nothing to gate later. The only hard
 * requirement is a non-blank legal name (an entirely empty profile isn't a
 * profile); everything else is optional and only format-checked when
 * non-blank, so a partially-filled draft always saves cleanly. Email/phone
 * regexes intentionally match the loose, format-only checks used in
 * lib/contracts/schema.ts, so the same input is judged the same way
 * whether it's typed into a contract or into the saved profile.
 */

const SHORT_TEXT_MAX = 200;
const ADDRESS_MAX = 300;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s\-().+]{7,20}$/;
const ZIP_RE = /^\d{5}(-\d{4})?$/;

export const buyerProfileSchema = z.object({
  legalName: z.string().trim().min(1, "Enter a legal name.").max(SHORT_TEXT_MAX, "That name is too long."),
  entityName: z.string().trim().max(SHORT_TEXT_MAX, "That's too long.").default(""),
  mailingAddressLine1: z.string().trim().max(ADDRESS_MAX, "That's too long.").default(""),
  mailingCity: z.string().trim().max(SHORT_TEXT_MAX, "That's too long.").default(""),
  mailingState: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .refine((v) => v === "" || /^[A-Z]{2}$/.test(v), "Use a 2-letter state code.")
    .default(""),
  mailingZip: z
    .string()
    .trim()
    .max(10)
    .refine((v) => v === "" || ZIP_RE.test(v), "Enter a valid ZIP code (12345 or 12345-6789).")
    .default(""),
  email: z
    .string()
    .trim()
    .max(SHORT_TEXT_MAX)
    .refine((v) => v === "" || EMAIL_RE.test(v), "Enter a valid email address.")
    .default(""),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v === "" || PHONE_RE.test(v), "Enter a valid phone number.")
    .default(""),
});

/** Output type (after zod defaults/transforms) — what save() receives. */
export type BuyerProfileFormValues = z.infer<typeof buyerProfileSchema>;
/** Input type (before defaults) — what useForm's TFieldValues generic needs. */
export type BuyerProfileFormInput = z.input<typeof buyerProfileSchema>;
