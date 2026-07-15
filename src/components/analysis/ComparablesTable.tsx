"use client";

import { formatCents } from "@/lib/calculations/money";
import type { ComparableSale } from "@/lib/property/types";

type ComparablesTableProps = {
  comparables: ComparableSale[];
  onChange: (next: ComparableSale[]) => void;
};

export function ComparablesTable({ comparables, onChange }: ComparablesTableProps) {
  function toggleIncluded(id: string) {
    onChange(comparables.map((c) => (c.id === id ? { ...c, included: !c.included } : c)));
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-white">Simulated comparable sales</h2>
        <span className="rounded-full border border-accent-3/25 bg-accent-3/10 px-2.5 py-1 text-[11px] font-medium text-accent-3">
          Simulated
        </span>
      </div>
      <p className="text-xs text-muted mb-4">
        Include or exclude comps to adjust the suggested ARV. All comps below are generated demo data, not real sales.
      </p>

      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-2 pr-3 font-medium">Include</th>
              <th className="py-2 pr-3 font-medium">Address</th>
              <th className="py-2 pr-3 font-medium">Sale price</th>
              <th className="py-2 pr-3 font-medium">Sale date</th>
              <th className="py-2 pr-3 font-medium">Distance</th>
              <th className="py-2 pr-3 font-medium">Sqft</th>
              <th className="py-2 pr-3 font-medium">$/sqft</th>
              <th className="py-2 pr-3 font-medium">Bd/Ba</th>
              <th className="py-2 pr-3 font-medium">Similarity</th>
            </tr>
          </thead>
          <tbody>
            {comparables.map((comp) => (
              <tr key={comp.id} className={`border-b border-border/60 ${comp.included ? "" : "opacity-40"}`}>
                <td className="py-2.5 pr-3">
                  <input
                    type="checkbox"
                    checked={comp.included}
                    onChange={() => toggleIncluded(comp.id)}
                    aria-label={`Include ${comp.address} in ARV calculation`}
                    className="h-4 w-4 rounded border-border bg-surface accent-accent"
                  />
                </td>
                <td className="py-2.5 pr-3 text-white/80 whitespace-nowrap">
                  {comp.address}
                  <span className="ml-2 rounded-full border border-border px-1.5 py-0.5 text-[10px] text-white/40">simulated</span>
                </td>
                <td className="py-2.5 pr-3 text-white tabular-nums whitespace-nowrap">{formatCents(comp.salePriceCents)}</td>
                <td className="py-2.5 pr-3 text-white/60 whitespace-nowrap">
                  {new Date(comp.saleDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </td>
                <td className="py-2.5 pr-3 text-white/60 whitespace-nowrap">{comp.distanceMiles} mi</td>
                <td className="py-2.5 pr-3 text-white/60 tabular-nums">{comp.squareFootage.toLocaleString()}</td>
                <td className="py-2.5 pr-3 text-white/60 tabular-nums whitespace-nowrap">
                  {formatCents(comp.pricePerSqftCents, { showCents: true })}
                </td>
                <td className="py-2.5 pr-3 text-white/60 whitespace-nowrap">
                  {comp.bedrooms}/{comp.bathrooms}
                </td>
                <td className="py-2.5 pr-3 text-white/60 tabular-nums">{comp.similarityScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
