import { CONDITION_PRESETS, REPAIR_CATEGORIES, type ConditionPresetKey, type RepairCategory } from "@/config/repairPresets";

export type RepairMode = "per_sqft" | "category" | "manual";

export type RepairCategoryLineItem = {
  included: boolean;
  costCents: number;
  notes: string;
};

export type RepairEstimateState = {
  mode: RepairMode;
  conditionPreset: ConditionPresetKey;
  perSqftRateCents: number;
  categories: Record<RepairCategory, RepairCategoryLineItem>;
  manualTotalCents: number;
};

export function defaultCategoryLineItems(preset: ConditionPresetKey): Record<RepairCategory, RepairCategoryLineItem> {
  const defaults = CONDITION_PRESETS[preset].categoryDefaultsCents;
  const result = {} as Record<RepairCategory, RepairCategoryLineItem>;
  for (const category of REPAIR_CATEGORIES) {
    const costCents = defaults[category];
    result[category] = { included: costCents > 0, costCents, notes: "" };
  }
  return result;
}

export function createDefaultRepairEstimateState(
  preset: ConditionPresetKey = "moderate_renovation",
): RepairEstimateState {
  const range = CONDITION_PRESETS[preset];
  const midpoint = Math.round((range.costPerSqftCentsLow + range.costPerSqftCentsHigh) / 2);
  return {
    mode: "category",
    conditionPreset: preset,
    perSqftRateCents: midpoint,
    categories: defaultCategoryLineItems(preset),
    manualTotalCents: 0,
  };
}

export function computeRepairTotalCents(state: RepairEstimateState, squareFootage: number | null): number {
  switch (state.mode) {
    case "per_sqft": {
      const sqft = squareFootage ?? 0;
      return Math.max(0, Math.round(state.perSqftRateCents * sqft));
    }
    case "category": {
      return REPAIR_CATEGORIES.reduce((sum, category) => {
        const item = state.categories[category];
        return item.included ? sum + Math.max(0, Math.round(item.costCents)) : sum;
      }, 0);
    }
    case "manual":
      return Math.max(0, Math.round(state.manualTotalCents));
    default:
      return 0;
  }
}
