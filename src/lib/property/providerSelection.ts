"use server";

import { getPropertyDataMode, getRentCastApiKey } from "@/config/env";
import { propertyDataProvider as mockProvider } from "@/lib/property/mockPropertyDataProvider";
import { getRealPropertyData } from "@/lib/property/rentcast/rentcastProvider";
import type { NormalizedAddress, PropertyDataResult } from "@/lib/property/types";

/**
 * The one server entry point the client calls to analyze an address. Routes
 * to RentCast when PROPERTY_DATA_MODE=rentcast and a key is configured;
 * otherwise falls back to the deterministic demo provider. The client never
 * sees which branch ran except through the result's `property.source`.
 */
export async function analyzePropertyAddress(
  address: NormalizedAddress,
  options?: { forceRefresh?: boolean },
): Promise<PropertyDataResult> {
  const mode = getPropertyDataMode();

  if (mode === "rentcast") {
    if (!getRentCastApiKey()) {
      return {
        status: "error",
        error: {
          code: "missing_api_key",
          message: "Real property data isn't configured on this server yet. An administrator needs to set RENTCAST_API_KEY.",
        },
      };
    }
    return getRealPropertyData(address, options);
  }

  return mockProvider.getPropertyByAddress(address, options);
}

/**
 * Reflects the *configured* mode (what a submission will actually attempt),
 * not whether it's currently working — a missing key still reports
 * "rentcast" here so the page copy matches what happens on submit. The
 * missing-key case is explained via the error banner after a real attempt,
 * not by silently describing the page as demo mode ahead of time.
 */
export async function getCurrentPropertyDataMode(): Promise<"rentcast" | "demo"> {
  return getPropertyDataMode();
}
