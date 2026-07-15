const ALLOWED_ZILLOW_HOSTS = new Set(["www.zillow.com", "zillow.com"]);

export type ParsedZillowUrl = {
  addressSlug: string;
  zpid: string | null;
  guessedAddressSlug: string;
};

/**
 * Only ever inspects the URL string itself — this app never fetches or
 * scrapes any external page. It validates the host/path shape and pulls the
 * address slug and zpid out of the URL for use as a stable, deterministic
 * lookup key.
 */
export function isAllowedZillowUrl(rawUrl: string): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (!ALLOWED_ZILLOW_HOSTS.has(url.hostname.toLowerCase())) return false;
  if (!url.pathname.startsWith("/homedetails/")) return false;

  return true;
}

export function parseZillowUrl(rawUrl: string): ParsedZillowUrl | null {
  if (!isAllowedZillowUrl(rawUrl)) return null;

  const url = new URL(rawUrl);
  const parts = url.pathname.split("/").filter(Boolean);
  // ["homedetails", "123-Main-St-City-ST-12345", "12345678_zpid"]
  if (parts[0] !== "homedetails" || parts.length < 2) return null;

  const addressSlug = parts[1];
  if (!addressSlug) return null;

  const zpidPart = parts[2] ?? "";
  const zpidMatch = zpidPart.match(/^(\d+)_zpid$/);
  const zpid = zpidMatch ? zpidMatch[1] : null;

  return { addressSlug, zpid, guessedAddressSlug: addressSlug };
}
