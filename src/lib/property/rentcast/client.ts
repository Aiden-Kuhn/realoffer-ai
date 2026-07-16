import "server-only";
import { getRentCastApiKey } from "@/config/env";
import type { ProviderError, ProviderErrorCode } from "@/lib/property/types";
import type { RentCastPropertyRecord, RentCastSaleListing, RentCastValueEstimate } from "@/lib/property/rentcast/rawTypes";

const BASE_URL = "https://api.rentcast.io/v1";
const REQUEST_TIMEOUT_MS = 10_000;

// Hardcoded, approved endpoints only — the client never accepts a caller-supplied URL.
const ENDPOINTS = {
  properties: `${BASE_URL}/properties`,
  saleListings: `${BASE_URL}/listings/sale`,
  valueEstimate: `${BASE_URL}/avm/value`,
} as const;

export class RentCastApiError extends Error {
  code: ProviderErrorCode;
  constructor(code: ProviderErrorCode, message: string) {
    super(message);
    this.name = "RentCastApiError";
    this.code = code;
  }

  toProviderError(): ProviderError {
    return { code: this.code, message: this.message };
  }
}

let devRequestCount = 0;

function logDevRequest(endpoint: string): void {
  if (process.env.NODE_ENV === "production") return;
  devRequestCount += 1;
  // Intentionally logs only the endpoint name and a running count — never
  // headers, query params, or response bodies, which could contain the
  // address or (for other endpoints) sensitive data.
  console.log(`[rentcast] request #${devRequestCount} -> ${endpoint}`);
}

async function rentcastGet<T>(endpointUrl: keyof typeof ENDPOINTS, params: Record<string, string>): Promise<T> {
  const apiKey = getRentCastApiKey();
  if (!apiKey) {
    throw new RentCastApiError("missing_api_key", "Real property data isn't configured on this server yet.");
  }

  const url = new URL(ENDPOINTS[endpointUrl]);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  logDevRequest(endpointUrl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: { "X-Api-Key": apiKey, Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new RentCastApiError("timeout", "The property data provider took too long to respond.");
    }
    throw new RentCastApiError("network_error", "Couldn't reach the property data provider.");
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401 || response.status === 403) {
    throw new RentCastApiError("invalid_api_key", "The configured property data API key was rejected.");
  }
  if (response.status === 429) {
    throw new RentCastApiError("rate_limited", "The property data provider is rate-limiting requests right now.");
  }
  if (response.status === 404) {
    throw new RentCastApiError("not_found", "No matching property was found.");
  }
  if (!response.ok) {
    throw new RentCastApiError("unknown", `The property data provider returned an unexpected error (${response.status}).`);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new RentCastApiError("malformed_response", "The property data provider returned a response we couldn't read.");
  }
}

export async function fetchPropertyRecords(address: string): Promise<RentCastPropertyRecord[]> {
  const result = await rentcastGet<RentCastPropertyRecord[] | RentCastPropertyRecord>("properties", { address });
  return Array.isArray(result) ? result : [result];
}

export async function fetchActiveSaleListings(address: string): Promise<RentCastSaleListing[]> {
  try {
    const result = await rentcastGet<RentCastSaleListing[]>("saleListings", { address, status: "Active" });
    const listings = Array.isArray(result) ? result : [];
    // Defense in depth: the status=Active query param isn't a hard
    // guarantee, and this function's whole contract is "active listings
    // only" — callers rely on "non-empty result" meaning "currently for
    // sale," not "RentCast has a record, possibly stale."
    return listings.filter((l) => (l.status ?? "").trim().toLowerCase() === "active");
  } catch (err) {
    // No active listing is a normal, expected outcome — not found here
    // means "no listing," not "provider failure."
    if (err instanceof RentCastApiError && err.code === "not_found") return [];
    throw err;
  }
}

export async function fetchValueEstimate(address: string): Promise<RentCastValueEstimate | null> {
  try {
    return await rentcastGet<RentCastValueEstimate>("valueEstimate", { address });
  } catch (err) {
    if (err instanceof RentCastApiError && err.code === "not_found") return null;
    throw err;
  }
}
