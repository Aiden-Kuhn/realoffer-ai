import type { NormalizedAddress } from "@/lib/property/types";

export type ManualAddressInput = {
  line1: string;
  city: string;
  state: string;
  zip: string;
};

const US_STATE_ABBREVIATIONS = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA",
  "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT",
  "VA", "WA", "WV", "WI", "WY", "DC",
]);

export function isKnownStateAbbreviation(state: string): boolean {
  return US_STATE_ABBREVIATIONS.has(state.trim().toUpperCase());
}

function titleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => (word.length === 0 ? word : word[0].toUpperCase() + word.slice(1).toLowerCase()))
    .join(" ");
}

export function normalizeManualAddress(input: ManualAddressInput): NormalizedAddress {
  const line1 = titleCase(input.line1);
  const city = titleCase(input.city);
  const state = input.state.trim().toUpperCase();
  const zip = input.zip.trim();
  const formatted = `${line1.toUpperCase()}, ${city.toUpperCase()}, ${state} ${zip}`;

  return { line1, city, state, zip, formatted };
}

/**
 * Best-effort normalization of an address-like slug pulled from a listing
 * URL (e.g. "123-Main-St-Austin-TX-78701"). This is a heuristic, not a
 * geocoder — it only needs to produce a stable, human-readable address for
 * demo purposes.
 */
export function normalizeSlugAddress(rawSlug: string): NormalizedAddress {
  const words = rawSlug
    .replace(/_/g, " ")
    .split(/[\s-]+/)
    .map((w) => w.trim())
    .filter(Boolean);

  const zipMatch = words.length > 0 ? words[words.length - 1].match(/^\d{5}$/) : null;
  const zip = zipMatch ? zipMatch[0] : "";
  const withoutZip = zip ? words.slice(0, -1) : words;

  const stateCandidate = withoutZip.length > 0 ? withoutZip[withoutZip.length - 1] : "";
  const hasState = isKnownStateAbbreviation(stateCandidate);
  const state = hasState ? stateCandidate.toUpperCase() : "";
  const withoutState = hasState ? withoutZip.slice(0, -1) : withoutZip;

  // Heuristic: the city is the last word before the state (single-token
  // fallback since slugs rarely preserve multi-word city spacing reliably).
  const city = withoutState.length > 0 ? withoutState[withoutState.length - 1] : "";
  const streetWords = withoutState.length > 1 ? withoutState.slice(0, -1) : withoutState;

  const line1 = titleCase(streetWords.join(" ")) || titleCase(rawSlug.replace(/-/g, " "));
  const cityTitled = titleCase(city);

  const formatted = [
    line1.toUpperCase(),
    cityTitled ? cityTitled.toUpperCase() : null,
    [state, zip].filter(Boolean).join(" ") || null,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    line1,
    city: cityTitled,
    state,
    zip,
    formatted: formatted || rawSlug.toUpperCase(),
  };
}
