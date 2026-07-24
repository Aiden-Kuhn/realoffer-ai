import { z } from "zod";

export const manualPropertySchema = z.object({
  line1: z.string().trim().min(3, "Enter a street address."),
  city: z.string().trim().min(2, "Enter a city."),
  state: z
    .string()
    .trim()
    .length(2, "Use a 2-letter state code.")
    .regex(/^[A-Za-z]{2}$/, "Use a 2-letter state code."),
  zip: z.string().trim().regex(/^\d{5}$/, "Enter a 5-digit ZIP code."),
  // z.literal("") must come first: Number("") === 0 in JS, so z.coerce.number()
  // would otherwise happily "succeed" on a blank field and coerce it to 0.
  listPrice: z.literal("").or(z.coerce.number().nonnegative("List price cannot be negative.")).optional(),
  bedrooms: z
    .literal("")
    .or(
      z.coerce
        .number()
        .int("Bedrooms must be a whole number.")
        .min(0, "Bedrooms cannot be negative.")
        .max(20, "Enter 20 or fewer bedrooms."),
    )
    .optional(),
  bathrooms: z
    .literal("")
    .or(z.coerce.number().min(0, "Bathrooms cannot be negative.").max(20, "Enter 20 or fewer bathrooms."))
    .optional(),
  squareFootage: z
    .literal("")
    .or(
      z.coerce
        .number()
        .int("Square footage must be a whole number.")
        .min(0, "Square footage cannot be negative.")
        .max(50_000, "Enter a value under 50,000 sqft."),
    )
    .optional(),
  yearBuilt: z
    .literal("")
    .or(
      z.coerce
        .number()
        .int("Enter a valid year.")
        .min(1800, "Enter a year of 1800 or later.")
        .max(new Date().getFullYear(), `Enter a year no later than ${new Date().getFullYear()}.`),
    )
    .optional(),
  propertyType: z.enum(["single_family", "condo", "townhouse", "multi_family", "manufactured", "land"]),
});

/** Output type (after zod coercion) — what onSubmit receives. */
export type ManualPropertyFormValues = z.infer<typeof manualPropertySchema>;
/** Input type (before coercion) — what useForm's TFieldValues generic needs. */
export type ManualPropertyFormInput = z.input<typeof manualPropertySchema>;

export const listingLinkSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Paste a Zillow listing link.")
    .url("Enter a valid URL."),
});

export type ListingLinkFormValues = z.infer<typeof listingLinkSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your name."),
    companyName: z.string().trim().optional(),
    email: z.string().trim().email("Enter a valid email address."),
    // Supabase's default minimum password length is 6 characters.
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string().min(1, "Re-enter your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Re-enter your new password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(8, "Password must be at least 8 characters."),
    confirmNewPassword: z.string().min(1, "Re-enter your new password."),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match.",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from your current password.",
    path: ["newPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const settingsSchema = z.object({
  fullName: z.string().trim().optional(),
  companyName: z.string().trim().optional(),
  defaultAssignmentFee: z.coerce.number().min(0, "Cannot be negative.").max(1_000_000_000, "Enter a smaller amount."),
  defaultInvestorArvPercentage: z.coerce.number().min(0, "Cannot be negative.").max(100, "Enter 100 or less."),
  defaultHoldingPeriodMonths: z.coerce.number().min(0, "Cannot be negative.").max(60, "Enter 60 months or fewer."),
  defaultBuyerClosingCostPercentage: z.coerce.number().min(0, "Cannot be negative.").max(100, "Enter 100 or less."),
  defaultSellingCostPercentage: z.coerce.number().min(0, "Cannot be negative.").max(100, "Enter 100 or less."),
  defaultFinancingCostPercentage: z.coerce.number().min(0, "Cannot be negative.").max(100, "Enter 100 or less."),
});

/** Output type (after zod coercion) — what onSubmit receives. */
export type SettingsFormValues = z.infer<typeof settingsSchema>;
/** Input type (before coercion) — what useForm's TFieldValues generic needs. */
export type SettingsFormInput = z.input<typeof settingsSchema>;
