import Link from "next/link";
import { Trash2 } from "lucide-react";
import { formatCents } from "@/lib/calculations/money";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { DealScoreBadge } from "@/components/shared/DealScoreBadge";
import { deriveDealInsights } from "@/lib/investmentAnalysis/deriveDealInsights";
import { formatBedsBaths } from "@/lib/property/labels";
import { resolveEffectiveBedsBaths } from "@/lib/property/bedsBathsOverride";
import type { Deal } from "@/types/deal";

/** The mobile stacked-card equivalent of DealsTable — same trimmed set of
 * facts (address, score, MAO, profit, status, analyzed date), nothing more. */
export function DealCard({ deal, onDeleteRequest }: { deal: Deal; onDeleteRequest: (id: string) => void }) {
  const isProfitNegative = deal.results.projectedInvestorProfitCents < 0;
  const insights = deriveDealInsights(deal);
  const effective = resolveEffectiveBedsBaths(deal);
  const bedsBaths = formatBedsBaths(effective.bedrooms, effective.bathrooms);

  return (
    <div className="relative rounded-2xl border border-border bg-surface p-5 transition-colors duration-200 hover:border-border-strong">
      <Link href={`/dashboard/deals/${deal.id}`} className="absolute inset-0 rounded-2xl" aria-label={`Open ${deal.property.address.line1}`} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white">{deal.property.address.line1}</span>
            <SourceBadge kind={deal.dataMode === "real" ? "provider_record" : "demo"} />
          </div>
          <p className="text-xs text-muted mt-1">
            {deal.property.address.city}, {deal.property.address.state}
            {bedsBaths ? ` · ${bedsBaths}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDeleteRequest(deal.id)}
          aria-label={`Delete ${deal.property.address.line1}`}
          className="relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/30 hover:text-red-300 hover:bg-red-400/10 active:scale-[0.98] transition-all duration-150"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <StatusBadge status={deal.status} />
        <DealScoreBadge score={insights.dealScore.score} label={insights.dealScore.label} labelText={insights.dealScore.labelText} compact />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 text-sm">
        <div className="min-w-0 rounded-lg border border-border bg-surface-2 px-3.5 py-2.5">
          <p className="text-[11px] text-muted">Max offer</p>
          <p className="mt-0.5 truncate font-semibold tabular-nums text-white">{formatCents(deal.results.maximumAllowableOfferCents)}</p>
        </div>
        <div
          className={`min-w-0 rounded-lg border px-3.5 py-2.5 ${
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

      <p className="mt-4 text-xs text-muted">
        Analyzed {new Date(deal.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </p>
    </div>
  );
}
