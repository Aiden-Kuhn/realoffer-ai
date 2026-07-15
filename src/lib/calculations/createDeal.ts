import { DEFAULT_ASSUMPTIONS } from "@/config/defaults";
import { buildDealFinancialResults } from "@/lib/calculations/buildDealResults";
import { createDefaultRepairEstimateState } from "@/lib/calculations/repairs";
import type { AppSettings } from "@/lib/repositories/settingsRepository";
import type { PropertyRecord } from "@/lib/property/types";
import type { Deal, DealAssumptions } from "@/types/deal";

export function buildAssumptionsFromSettings(property: PropertyRecord, settings: AppSettings): DealAssumptions {
  const baseValueCents = property.arvExpectedCents;
  const contractPriceCents = property.listPriceCents ?? Math.round(baseValueCents * 0.65);

  return {
    contractPriceCents,
    arvOverrideCents: null,
    desiredAssignmentFeeCents: settings.defaultAssignmentFeeCents,
    buyerClosingCostsCents: Math.round(baseValueCents * settings.defaultBuyerClosingCostPercentage),
    holdingCostsCents: settings.defaultHoldingPeriodMonths * DEFAULT_ASSUMPTIONS.holdingCostPerMonthCents,
    financingCostsCents: Math.round(baseValueCents * settings.defaultFinancingCostPercentage),
    sellingCostsCents: Math.round(baseValueCents * settings.defaultSellingCostPercentage),
    investorTargetProfitCents: DEFAULT_ASSUMPTIONS.investorTargetProfitCents,
    investorArvPercentage: settings.defaultInvestorArvPercentage,
    maoMethod: "PERCENTAGE_OF_ARV",
  };
}

export function createDealFromProperty(property: PropertyRecord, settings: AppSettings): Deal {
  const assumptions = buildAssumptionsFromSettings(property, settings);
  const repairEstimate = createDefaultRepairEstimateState("moderate_renovation");
  repairEstimate.mode = "manual";
  repairEstimate.manualTotalCents = property.suggestedRepairCostCents;

  const comparables = property.comparables.map((c) => ({ ...c }));
  const results = buildDealFinancialResults(property, comparables, repairEstimate, assumptions);

  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: "draft",
    notes: "",
    property,
    comparables,
    assumptions,
    repairEstimate,
    results,
  };
}
