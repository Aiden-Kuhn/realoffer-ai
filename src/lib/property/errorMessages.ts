import type { ProviderErrorCode } from "@/lib/property/types";

export const PROVIDER_ERROR_MESSAGES: Record<ProviderErrorCode, string> = {
  missing_api_key: "Real property data isn't configured on this server yet.",
  invalid_api_key: "The property data provider rejected the server's API key. Contact an administrator.",
  rate_limited: "The property data provider is receiving too many requests right now. Please wait a moment and retry.",
  quota_exceeded: "This account has reached its property data usage limit for the current period.",
  timeout: "The property data provider took too long to respond.",
  network_error: "Couldn't reach the property data provider. Check your connection and retry.",
  not_found: "No property record was found for that address.",
  malformed_response: "The property data provider returned a response we couldn't read.",
  unsupported_property_type: "This property type isn't fully supported yet.",
  unknown: "Something went wrong retrieving property data.",
};

export function describeProviderErrorCode(code: ProviderErrorCode): string {
  return PROVIDER_ERROR_MESSAGES[code] ?? PROVIDER_ERROR_MESSAGES.unknown;
}
