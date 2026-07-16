/**
 * Server-only environment access. Never import this from a "use client"
 * component — it exists specifically so the RentCast API key never reaches
 * client code (no NEXT_PUBLIC_ prefix is ever used for it).
 */
import "server-only";

export type PropertyDataMode = "rentcast" | "demo";

export function getPropertyDataMode(): PropertyDataMode {
  const raw = process.env.PROPERTY_DATA_MODE?.trim().toLowerCase();
  return raw === "rentcast" ? "rentcast" : "demo";
}

export function getRentCastApiKey(): string | null {
  const key = process.env.RENTCAST_API_KEY?.trim();
  return key ? key : null;
}

/** True when real RentCast lookups are both requested and actually configured. */
export function isRentCastEnabled(): boolean {
  return getPropertyDataMode() === "rentcast" && getRentCastApiKey() !== null;
}
