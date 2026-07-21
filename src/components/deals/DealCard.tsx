import Link from "next/link";
import { formatCents } from "@/lib/calculations/money";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { DealScoreBadge } from "@/components/shared/DealScoreBadge";
import { deriveDealInsights } from "@/lib/investmentAnalysis/deriveDealInsights";
import { formatBedsBaths } from "@/lib/property/labels";
import { resolveEffectiveBedsBaths } from "@/lib/property/bedsBathsOverride";
import type { Deal } from "@/types/deal";

export function DealCard({ deal, onDeleteRequest }: { deal: Deal; onDeleteRequest: (id: string) => void }) {
  const arv = deal.assumptions.arvOverrideCents ?? deal.property.arvExpectedCents;
  const isProfitNegative = deal.results.projectedInvestorProfitCents < 0;
  const insights = deriveDealInsights(deal);
  const effective = resolveEffectiveBedsBaths(deal);
  const bedsBaths = formatBedsBaths(effective.bedrooms, effective.bathrooms);

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 transition-colors duration-200 hover:border-border-strong">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/dashboard/deals/${deal.id}`} className="font-medium text-white hover:text-accent-3 transition-colors">
              {deal.property.address.line1}
            </Link>
            <SourceBadge kind={deal.dataMode === "real" ? "provider_record" : "demo"} />
          </div>
          <p className="text-xs text-muted mt-0.5">
            {deal.property.address.city}, {deal.property.address.state}
            {bedsBaths ? ` · ${bedsBaths}` : ""} ·{" "}
            {new Date(deal.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StatusBadge status={deal.status} />
          <DealScoreBadge score={insights.dealScore.score} label={insights.dealScore.label} labelText={insights.dealScore.labelText} compact />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 auto-rows-fr gap-2 text-sm">
        <div className="min-w-0 rounded-lg border border-border bg-surface-2 px-3 py-2">
          <p className="text-[11px] text-muted">ARV</p>
          <p className="mt-0.5 truncate font-semibold tabular-nums text-white">{formatCents(arv)}</p>
        </div>
        <div className="min-w-0 rounded-lg border border-border bg-surface-2 px-3 py-2">
          <p className="text-[11px] text-muted">MAO</p>
          <p className="mt-0.5 truncate font-semibold tabular-nums text-white">{formatCents(deal.results.maximumAllowableOfferCents)}</p>
        </div>
        <div
          className={`min-w-0 rounded-lg border px-3 py-2 ${
            isProfitNegative ? "border-red-400/20 bg-red-400/[0.05]" : "border-emerald-400/20 bg-emerald-400/[0.05]"
          }`}
        >
          <p className={`text-[11px] ${isProfitNegative ? "text-red-300/80" : "text-emerald-300/80"}`}>Profit</p>
          <p className={`mt-0.5 truncate font-semibold tabular-nums ${isProfitNegative ? "text-red-400" : "text-emerald-400"}`}>
            {formatCents(deal.results.projectedInvestorProfitCents)}
          </p>
        </div>
      </div>

      {insights.hasAnalysis && insights.isStale ? (
        <p className="mt-3 text-[11px] text-amber-300/80">Analysis is based on previous assumptions — reopen to regenerate.</p>
      ) : null}

      <div className="mt-4 flex items-center justify-between">
        <Link href={`/dashboard/deals/${deal.id}`} className="text-xs font-medium text-accent-3 hover:text-accent-3/80 transition-colors">
          View details
        </Link>
        <button
          type="button"
          onClick={() => onDeleteRequest(deal.id)}
          className="text-xs font-medium text-white/40 hover:text-red-300 active:scale-[0.98] transition-all duration-150"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
