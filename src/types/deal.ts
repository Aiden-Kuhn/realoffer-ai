import type { MaoMethod, DealFinancialResults } from "@/lib/calculations/types";
import type { RepairEstimateState } from "@/lib/calculations/repairs";
import type { ComparableSale, PropertyRecord } from "@/lib/property/types";
import type { InvestmentAnalysisResult } from "@/lib/investmentAnalysis/types";

export const DEAL_PIPELINE_STATUSES = [
  "draft",
  "analyzing",
  "potential",
  "pursuing",
  "under_contract",
  "assigned",
  "closed",
  "passed",
] as const;

export type DealPipelineStatus = (typeof DEAL_PIPELINE_STATUSES)[number];

export const DEAL_PIPELINE_STATUS_LABELS: Record<DealPipelineStatus, string> = {
  draft: "Draft",
  analyzing: "Analyzing",
  potential: "Potential",
  pursuing: "Pursuing",
  under_contract: "Under Contract",
  assigned: "Assigned",
  closed: "Closed",
  passed: "Passed",
};

export type DealAssumptions = {
  contractPriceCents: number;
  arvOverrideCents: number | null;
  desiredAssignmentFeeCents: number;
  buyerClosingCostsCents: number;
  holdingCostsCents: number;
  financingCostsCents: number;
  sellingCostsCents: number;
  investorTargetProfitCents: number;
  investorArvPercentage: number;
  maoMethod: MaoMethod;
};

/** Derived from property.source at creation time; carried on the deal so
 * the saved-deals list can label real vs. demo analyses without re-deriving
 * it from a possibly-refreshed property record. */
export type DealDataMode = "real" | "demo";

export type Deal = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: DealPipelineStatus;
  notes: string;
  property: PropertyRecord;
  comparables: ComparableSale[];
  assumptions: DealAssumptions;
  repairEstimate: RepairEstimateState;
  results: DealFinancialResults;
  isSample?: boolean;
  dataMode: DealDataMode;
  /** Absent for deals saved before the Investment Analyst milestone, or
   * for any deal that hasn't had an analysis generated yet — both render
   * as "Generate Analysis" rather than an error. See lib/investmentAnalysis. */
  investmentAnalysis?: InvestmentAnalysisResult;
  /** A user-entered correction to the provider's (RentCast/demo) bedroom or
   * bathroom count for this specific deal — kept fully separate from
   * `property.bedrooms`/`bathrooms`, which is never overwritten. `null`/
   * absent means "use the provider value." See lib/property/bedsBathsOverride.ts
   * for how every consumer (display, investment calculations, contracts)
   * resolves the effective value from this + `property`. */
  bedroomsOverride?: number | null;
  bathroomsOverride?: number | null;
};
