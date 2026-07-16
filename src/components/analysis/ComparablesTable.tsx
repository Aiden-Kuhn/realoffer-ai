"use client";

import { formatCents } from "@/lib/calculations/money";
import { SourceBadge } from "@/components/shared/SourceBadge";
import type { ComparableSale } from "@/lib/property/types";

type ComparablesTableProps = {
  comparables: ComparableSale[];
  onChange: (next: ComparableSale[]) => void;
};

const SALE_TYPE_LABELS: Record<ComparableSale["saleType"], string> = {
  sold: "Off-market",
  active_listing: "Active listing",
  unknown: "Status unknown",
};

export function ComparablesTable({ comparables, onChange }: ComparablesTableProps) {
  function toggleIncluded(id: string) {
    onChange(comparables.map((c) => (c.id === id ? { ...c, included: !c.included } : c)));
  }

  const isReal = comparables.some((c) => c.source === "rentcast");

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-white">Comparable sales</h2>
        <SourceBadge kind={isReal ? "provider_record" : "demo"} />
      </div>
      <p className="text-xs text-muted mb-5">
        Include or exclude comps to adjust the suggested ARV. {isReal
          ? "RentCast reports each comp's current listing status, not necessarily a closed sale — off-market comps are included by default, active listings are not."
          : "All comps below are generated demo data, not real sales."}
      </p>

      {comparables.length === 0 ? (
        <p className="text-sm text-muted py-6 text-center">No comparable properties were available for this address.</p>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="py-2 pr-3 font-medium">Include</th>
                <th className="py-2 pr-3 font-medium">Address</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Price</th>
                <th className="py-2 pr-3 font-medium">Date</th>
                <th className="py-2 pr-3 font-medium">Distance</th>
                <th className="py-2 pr-3 font-medium">Sqft</th>
                <th className="py-2 pr-3 font-medium">$/sqft</th>
                <th className="py-2 pr-3 font-medium">Bd/Ba</th>
                <th className="py-2 pr-3 font-medium">Similarity</th>
              </tr>
            </thead>
            <tbody>
              {comparables.map((comp) => (
                <tr
                  key={comp.id}
                  className={`border-b border-border/60 transition-colors duration-150 hover:bg-white/[0.02] ${comp.included ? "" : "opacity-40"}`}
                >
                  <td className="py-2.5 pr-3">
                    <input
                      type="checkbox"
                      checked={comp.included}
                      onChange={() => toggleIncluded(comp.id)}
                      aria-label={`Include ${comp.address} in ARV calculation`}
                      className="h-4 w-4 rounded border-border bg-surface accent-accent"
                    />
                  </td>
                  <td className="py-2.5 pr-3 text-white/80 whitespace-nowrap">{comp.address}</td>
                  <td className="py-2.5 pr-3 whitespace-nowrap">
                    <SourceBadge kind={comp.source === "rentcast" ? "provider_record" : "demo"} />
                    <span className="ml-1.5 text-xs text-white/50">{SALE_TYPE_LABELS[comp.saleType]}</span>
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
                  <td className="py-2.5 pr-3 text-white/60 tabular-nums whitespace-nowrap">
                    {comp.similarityScore}
                    <span className="ml-1 text-[10px] text-white/30">{comp.similaritySource === "provider" ? "provider" : "RealOffer"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
