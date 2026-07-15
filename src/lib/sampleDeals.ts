import { DEFAULT_SETTINGS } from "@/config/defaults";
import { createDealFromProperty } from "@/lib/calculations/createDeal";
import { normalizeManualAddress } from "@/lib/property/normalizeAddress";
import { propertyDataProvider } from "@/lib/property/mockPropertyDataProvider";
import type { Deal, DealPipelineStatus } from "@/types/deal";

/**
 * Fixed addresses chosen because they deterministically hash to each of the
 * four mock property profiles — used only when the user explicitly clicks
 * "Load sample deals" on an empty dashboard.
 */
const SAMPLE_ADDRESSES: Array<{ line1: string; city: string; state: string; zip: string; status: DealPipelineStatus }> = [
  { line1: "428 Maple Ridge Dr", city: "Austin", state: "TX", zip: "78701", status: "potential" },
  { line1: "17 Oak Hollow Ln", city: "Denver", state: "CO", zip: "80202", status: "analyzing" },
  { line1: "902 Cedar Point Ave", city: "Tampa", state: "FL", zip: "33602", status: "passed" },
  { line1: "365 Willow Creek Rd", city: "Columbus", state: "OH", zip: "43215", status: "draft" },
];

export async function generateSampleDeals(): Promise<Deal[]> {
  const deals: Deal[] = [];

  for (const sample of SAMPLE_ADDRESSES) {
    const address = normalizeManualAddress(sample);
    const property = await propertyDataProvider.getPropertyByAddress(address);
    const deal = createDealFromProperty(property, DEFAULT_SETTINGS);
    deal.status = sample.status;
    deal.isSample = true;
    deals.push(deal);
  }

  return deals;
}
