"use client";

import { suggestArvFromComparables } from "@/lib/calculations/arv";
import { centsToDollars, clampReasonableDollars, dollarsToCents, formatCents } from "@/lib/calculations/money";
import { inputClasses } from "@/components/shared/Field";
import type { ComparableSale, PropertyRecord } from "@/lib/property/types";

type ArvPanelProps = {
  property: PropertyRecord;
  comparables: ComparableSale[];
  arvOverrideCents: number | null;
  onChangeOverride: (cents: number | null) => void;
};

export function ArvPanel({ property, comparables, arvOverrideCents, onChangeOverride }: ArvPanelProps) {
  const suggestion = suggestArvFromComparables(comparables, {
    lowCents: property.arvLowCents,
    expectedCents: property.arvExpectedCents,
    highCents: property.arvHighCents,
  });

  const selectedCents = arvOverrideCents ?? suggestion.expectedCents;
  const isOverridden = arvOverrideCents !== null;

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-sm font-semibold text-white mb-1">ARV analysis</h2>
      <p className="text-xs text-muted mb-5">Simulated range based on comparable sales, recalculated as you include or exclude comps.</p>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl border border-border bg-surface-2 p-4">
          <p className="text-xs text-muted">Low ARV</p>
          <p className="mt-1 text-lg font-semibold text-white tabular-nums">{formatCents(suggestion.lowCents)}</p>
        </div>
        <div className="rounded-xl border border-accent-3/25 bg-accent-3/[0.06] p-4">
          <p className="text-xs text-accent-3">Expected ARV</p>
          <p className="mt-1 text-lg font-semibold text-white tabular-nums">{formatCents(suggestion.expectedCents)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-2 p-4">
          <p className="text-xs text-muted">High ARV</p>
          <p className="mt-1 text-lg font-semibold text-white tabular-nums">{formatCents(suggestion.highCents)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3.5 mb-3">
        <div>
          <p className="text-sm font-medium text-white">Selected ARV used in calculations</p>
          <p className="text-xs text-muted mt-0.5">{isOverridden ? "Manual override" : "Suggested from comparables"}</p>
        </div>
        <p className="text-lg font-semibold text-white tabular-nums">{formatCents(selectedCents)}</p>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-white/70 mb-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isOverridden}
          onChange={(e) => onChangeOverride(e.target.checked ? suggestion.expectedCents : null)}
          className="h-4 w-4 rounded border-border bg-surface accent-accent"
        />
        Override ARV manually
      </label>

      {isOverridden ? (
        <div className="relative max-w-xs">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-white/35">$</span>
          <input
            type="number"
            min={0}
            className={`${inputClasses} pl-7`}
            value={centsToDollars(arvOverrideCents ?? 0)}
            onChange={(e) => {
              onChangeOverride(dollarsToCents(clampReasonableDollars(Number(e.target.value))));
            }}
          />
        </div>
      ) : null}
    </section>
  );
}
