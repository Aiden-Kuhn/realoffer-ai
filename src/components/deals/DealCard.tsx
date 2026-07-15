import Link from "next/link";
import { formatCents } from "@/lib/calculations/money";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Deal } from "@/types/deal";

export function DealCard({ deal, onDeleteRequest }: { deal: Deal; onDeleteRequest: (id: string) => void }) {
  const arv = deal.assumptions.arvOverrideCents ?? deal.property.arvExpectedCents;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/dashboard/deals/${deal.id}`} className="font-medium text-white hover:text-accent-3 transition-colors">
            {deal.property.address.line1}
          </Link>
          <p className="text-xs text-muted mt-0.5">
            {deal.property.address.city}, {deal.property.address.state} ·{" "}
            {new Date(deal.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <StatusBadge status={deal.status} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted">ARV</p>
          <p className="text-white font-medium tabular-nums mt-0.5">{formatCents(arv)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">MAO</p>
          <p className="text-white font-medium tabular-nums mt-0.5">{formatCents(deal.results.maximumAllowableOfferCents)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Profit</p>
          <p
            className={`font-medium tabular-nums mt-0.5 ${
              deal.results.projectedInvestorProfitCents < 0 ? "text-red-400" : "text-emerald-400"
            }`}
          >
            {formatCents(deal.results.projectedInvestorProfitCents)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Link href={`/dashboard/deals/${deal.id}`} className="text-xs font-medium text-accent-3 hover:text-accent-3/80">
          View details
        </Link>
        <button
          type="button"
          onClick={() => onDeleteRequest(deal.id)}
          className="text-xs font-medium text-white/40 hover:text-red-300 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
