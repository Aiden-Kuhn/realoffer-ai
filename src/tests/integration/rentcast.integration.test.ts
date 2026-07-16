import { describe, expect, it } from "vitest";
import { getRealPropertyData } from "@/lib/property/rentcast/rentcastProvider";
import { normalizeManualAddress } from "@/lib/property/normalizeAddress";

/**
 * Optional, real-network integration test. Skipped entirely unless
 * RENTCAST_API_KEY is present in the environment — never runs as part of
 * `npm run test`, and never runs in CI unless that variable is deliberately
 * provided. Run with: npm run test:integration
 *
 * Update TEST_ADDRESS below to any real US address if you want to check a
 * different property. Never commit a real API key anywhere in this repo.
 */
const TEST_ADDRESS = { line1: "5500 Grand Lake Dr", city: "San Antonio", state: "TX", zip: "78244" };

const hasApiKey = Boolean(process.env.RENTCAST_API_KEY);

describe.skipIf(!hasApiKey)("RentCast live integration", () => {
  it(
    "retrieves a real property record for a known address",
    async () => {
      const address = normalizeManualAddress(TEST_ADDRESS);
      const result = await getRealPropertyData(address, { forceRefresh: true });

      expect(result.status).not.toBe("error");
      if (result.status === "ok") {
        expect(result.property.source).toBe("rentcast");
        expect(result.property.address.city.toLowerCase()).toContain("san antonio");
      }
    },
    20_000,
  );
});
