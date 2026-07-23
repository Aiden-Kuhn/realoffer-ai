/**
 * Deliberately hardcoded rather than derived from `window.location.origin`.
 * Supabase's Redirect URLs allow-list only contains these two exact URLs
 * (see the Supabase dashboard configuration required for this feature) —
 * if `resetPasswordForEmail`'s `redirectTo` doesn't match an allow-listed
 * entry, GoTrue silently falls back to the Site URL instead of erroring,
 * which is exactly the "the email link sends me to the main site" bug this
 * fixes. A dynamic origin would also produce a different, non-allow-listed
 * URL on every Vercel preview deployment.
 */
const PRODUCTION_RESET_PASSWORD_URL = "https://realoffer-ai.vercel.app/reset-password";
const LOCAL_RESET_PASSWORD_URL = "http://localhost:3000/reset-password";

export function getPasswordResetRedirectUrl(): string {
  return process.env.NODE_ENV === "production" ? PRODUCTION_RESET_PASSWORD_URL : LOCAL_RESET_PASSWORD_URL;
}
