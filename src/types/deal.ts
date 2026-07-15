import type { MaoMethod, DealFinancialResults } from "@/lib/calculations/types";
import type { RepairEstimateState } from "@/lib/calculations/repairs";
import type { ComparableSale, PropertyRecord } from "@/lib/property/types";

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
};
