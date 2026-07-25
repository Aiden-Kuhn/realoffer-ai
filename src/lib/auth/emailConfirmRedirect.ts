/**
 * Deliberately hardcoded rather than derived from `window.location.origin` —
 * same reasoning as passwordResetRedirect.ts: Supabase's Redirect URLs
 * allow-list only contains these two exact URLs, and an `emailRedirectTo`
 * that doesn't match an allow-listed entry makes GoTrue silently fall back
 * to the Site URL instead of erroring (which is what sends a freshly
 * verified user to the marketing homepage instead of /auth/confirm). A
 * dynamic origin would also produce a different, non-allow-listed URL on
 * every Vercel preview deployment.
 */
const PRODUCTION_EMAIL_CONFIRM_URL = "https://realoffer-ai.vercel.app/auth/confirm";
const LOCAL_EMAIL_CONFIRM_URL = "http://localhost:3000/auth/confirm";

export function getEmailConfirmRedirectUrl(): string {
  return process.env.NODE_ENV === "production" ? PRODUCTION_EMAIL_CONFIRM_URL : LOCAL_EMAIL_CONFIRM_URL;
}
