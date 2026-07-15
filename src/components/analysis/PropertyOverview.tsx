import { formatCents } from "@/lib/calculations/money";
import type { PropertyRecord } from "@/lib/property/types";

export function PropertyOverview({ property }: { property: PropertyRecord }) {
  const rows: Array<[string, string]> = [
    ["List price", property.listPriceCents !== null ? formatCents(property.listPriceCents) : "Not available"],
    ["Lot size", property.lotSizeSqft !== null ? `${property.lotSizeSqft.toLocaleString()} sqft` : "Not available"],
    ["Days on market", property.daysOnMarket !== null ? String(property.daysOnMarket) : "Not available"],
    ["Data last generated", new Date(property.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })],
  ];

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-sm font-semibold text-white mb-4">Property overview</h2>
      <p className="text-sm text-white/70 leading-relaxed mb-5">{property.description}</p>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-white">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
