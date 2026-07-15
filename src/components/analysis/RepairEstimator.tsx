"use client";

import { CONDITION_PRESETS, REPAIR_CATEGORIES, REPAIR_CATEGORY_LABELS, type ConditionPresetKey } from "@/config/repairPresets";
import { computeRepairTotalCents, defaultCategoryLineItems, type RepairEstimateState, type RepairMode } from "@/lib/calculations/repairs";
import { Tabs } from "@/components/shared/Tabs";
import {
  centsToDollars,
  clampReasonableDollars,
  clampReasonableRatePerSqft,
  dollarsToCents,
  formatCents,
} from "@/lib/calculations/money";
import { inputClasses, selectClasses } from "@/components/shared/Field";

type RepairEstimatorProps = {
  repairEstimate: RepairEstimateState;
  squareFootage: number | null;
  onChange: (next: RepairEstimateState) => void;
};

const MODE_ITEMS: Array<{ value: RepairMode; label: string }> = [
  { value: "per_sqft", label: "Cost per Sqft" },
  { value: "category", label: "Category by Category" },
  { value: "manual", label: "Manual Total" },
];

export function RepairEstimator({ repairEstimate, squareFootage, onChange }: RepairEstimatorProps) {
  const total = computeRepairTotalCents(repairEstimate, squareFootage);

  function setMode(mode: string) {
    onChange({ ...repairEstimate, mode: mode as RepairMode });
  }

  function setPreset(preset: ConditionPresetKey) {
    onChange({
      ...repairEstimate,
      conditionPreset: preset,
      categories: defaultCategoryLineItems(preset),
      perSqftRateCents: Math.round(
        (CONDITION_PRESETS[preset].costPerSqftCentsLow + CONDITION_PRESETS[preset].costPerSqftCentsHigh) / 2,
      ),
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2 className="text-sm font-semibold text-white">Repair estimator</h2>
        <span className="text-sm font-semibold text-white tabular-nums">{formatCents(total)}</span>
      </div>
      <p className="text-xs text-muted mb-4">
        Rough estimates only — actual repair costs vary by location, labor market, materials, and true property condition.
      </p>

      <Tabs items={MODE_ITEMS} value={repairEstimate.mode} onChange={setMode} className="mb-5" />

      <div className="mb-5">
        <span className="block text-sm font-medium text-white/80 mb-1.5">Condition preset</span>
        <select
          className={`${selectClasses} max-w-xs`}
          value={repairEstimate.conditionPreset}
          onChange={(e) => setPreset(e.target.value as ConditionPresetKey)}
        >
          {Object.entries(CONDITION_PRESETS).map(([key, preset]) => (
            <option key={key} value={key}>
              {preset.label} (${preset.costPerSqftCentsLow / 100}-${preset.costPerSqftCentsHigh / 100}/sqft)
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-muted">{CONDITION_PRESETS[repairEstimate.conditionPreset].description}</p>
      </div>

      {repairEstimate.mode === "per_sqft" ? (
        <div className="max-w-xs">
          <span className="block text-sm font-medium text-white/80 mb-1.5">Rate per square foot</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-white/35">$</span>
            <input
              type="number"
              min={0}
              step={0.5}
              className={`${inputClasses} pl-7`}
              value={centsToDollars(repairEstimate.perSqftRateCents)}
              onChange={(e) => {
                onChange({
                  ...repairEstimate,
                  perSqftRateCents: dollarsToCents(clampReasonableRatePerSqft(Number(e.target.value))),
                });
              }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {squareFootage ? `${squareFootage.toLocaleString()} sqft x rate` : "Square footage unavailable — total will be $0 until it is set."}
          </p>
        </div>
      ) : null}

      {repairEstimate.mode === "category" ? (
        <div className="flex flex-col divide-y divide-border border border-border rounded-xl overflow-hidden">
          {REPAIR_CATEGORIES.map((category) => {
            const item = repairEstimate.categories[category];
            return (
              <div key={category} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <label className="flex items-center gap-2.5 w-40 shrink-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.included}
                    onChange={(e) =>
                      onChange({
                        ...repairEstimate,
                        categories: { ...repairEstimate.categories, [category]: { ...item, included: e.target.checked } },
                      })
                    }
                    className="h-4 w-4 rounded border-border bg-surface accent-accent"
                  />
                  <span className="text-sm text-white/80">{REPAIR_CATEGORY_LABELS[category]}</span>
                </label>
                <div className="relative w-32">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/35">$</span>
                  <input
                    type="number"
                    min={0}
                    disabled={!item.included}
                    className={`${inputClasses} h-9 pl-6 text-sm disabled:opacity-40`}
                    value={centsToDollars(item.costCents)}
                    onChange={(e) => {
                      onChange({
                        ...repairEstimate,
                        categories: {
                          ...repairEstimate.categories,
                          [category]: { ...item, costCents: dollarsToCents(clampReasonableDollars(Number(e.target.value))) },
                        },
                      });
                    }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Notes"
                  disabled={!item.included}
                  value={item.notes}
                  onChange={(e) =>
                    onChange({
                      ...repairEstimate,
                      categories: { ...repairEstimate.categories, [category]: { ...item, notes: e.target.value } },
                    })
                  }
                  className="flex-1 min-w-[8rem] h-9 rounded-lg border border-border bg-surface px-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-accent/60 disabled:opacity-40"
                />
              </div>
            );
          })}
        </div>
      ) : null}

      {repairEstimate.mode === "manual" ? (
        <div className="max-w-xs">
          <span className="block text-sm font-medium text-white/80 mb-1.5">Manual repair total</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-white/35">$</span>
            <input
              type="number"
              min={0}
              className={`${inputClasses} pl-7`}
              value={centsToDollars(repairEstimate.manualTotalCents)}
              onChange={(e) => {
                onChange({
                  ...repairEstimate,
                  manualTotalCents: dollarsToCents(clampReasonableDollars(Number(e.target.value))),
                });
              }}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
