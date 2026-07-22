/**
 * Validates a `redirectTo` query param before trusting it for a post-login
 * navigation. Only ever allows a same-origin relative path — never an
 * absolute URL, a protocol-relative URL ("//evil.com", which browsers
 * resolve using the current protocol against that host), or anything else
 * that could send a signed-in user off the app. A classic open-redirect
 * vector if left unvalidated.
 */
export function resolveSafeRedirect(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return fallback;
  return raw;
}
