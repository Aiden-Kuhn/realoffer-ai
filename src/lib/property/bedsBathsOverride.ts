import type { PropertyRecord } from "@/lib/property/types";

/**
 * A user-entered correction to bedrooms/bathrooms always wins over the
 * provider (RentCast/demo) value — this is the single place that decides
 * "effective" bedrooms/bathrooms so every consumer (display, investment
 * calculations, contract prefill, PDF) agrees. The raw provider value on
 * `property` is never mutated by an override.
 */
export type EffectiveBedsBaths = {
  bedrooms: number | null;
  bathrooms: number | null;
  bedroomsIsOverridden: boolean;
  bathroomsIsOverridden: boolean;
};

type WithBedsBathsOverride = {
  property: Pick<PropertyRecord, "bedrooms" | "bathrooms">;
  bedroomsOverride?: number | null;
  bathroomsOverride?: number | null;
};

export function resolveEffectiveBedsBaths({ property, bedroomsOverride, bathroomsOverride }: WithBedsBathsOverride): EffectiveBedsBaths {
  const bedrooms = bedroomsOverride ?? property.bedrooms;
  const bathrooms = bathroomsOverride ?? property.bathrooms;
  return {
    bedrooms,
    bathrooms,
    bedroomsIsOverridden: bedroomsOverride !== null && bedroomsOverride !== undefined,
    bathroomsIsOverridden: bathroomsOverride !== null && bathroomsOverride !== undefined,
  };
}

/** Returns `property` unchanged when there's no override (no new object,
 * no unnecessary re-render), otherwise a shallow copy with bedrooms/
 * bathrooms replaced by the effective values — for callers (investment
 * analysis context, input hashing, offer guidance) that just need "the
 * property as the user currently understands it," not the override
 * bookkeeping itself. */
export function withEffectiveBedsBaths(property: PropertyRecord, bedroomsOverride?: number | null, bathroomsOverride?: number | null): PropertyRecord {
  const effective = resolveEffectiveBedsBaths({ property, bedroomsOverride, bathroomsOverride });
  if (effective.bedrooms === property.bedrooms && effective.bathrooms === property.bathrooms) return property;
  return { ...property, bedrooms: effective.bedrooms, bathrooms: effective.bathrooms };
}

const MAX_BEDROOMS = 20;
const MAX_BATHROOMS = 20;

export type OverrideParseResult = { ok: true; value: number | null } | { ok: false; error: string };

/** Blank input clears the override (falls back to the provider value) —
 * that's success, not an error. Never confuses "0" (a genuine studio /
 * no full bathrooms) with "blank" (no correction entered). */
export function parseBedroomsOverride(raw: string): OverrideParseResult {
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: true, value: null };
  const value = Number(trimmed);
  if (!Number.isFinite(value) || !Number.isInteger(value)) return { ok: false, error: "Bedrooms must be a whole number." };
  if (value < 0 || value > MAX_BEDROOMS) return { ok: false, error: `Bedrooms must be between 0 and ${MAX_BEDROOMS}.` };
  return { ok: true, value };
}

/** Allows halves (e.g. 1.5, 2.5) in addition to whole numbers, matching
 * how bathroom counts are conventionally reported. */
export function parseBathroomsOverride(raw: string): OverrideParseResult {
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: true, value: null };
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return { ok: false, error: "Bathrooms must be a number." };
  if (value < 0 || value > MAX_BATHROOMS) return { ok: false, error: `Bathrooms must be between 0 and ${MAX_BATHROOMS}.` };
  if (Math.round(value * 2) !== value * 2) return { ok: false, error: "Bathrooms must be a whole or half number (e.g. 1.5)." };
  return { ok: true, value };
}
