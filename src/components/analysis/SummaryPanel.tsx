"use client";

import { ChevronDown, Check } from "lucide-react";
import { formatCents } from "@/lib/calculations/money";
import { ClassificationBadge } from "@/components/shared/ClassificationBadge";
import { DealScoreBadge } from "@/components/shared/DealScoreBadge";
import { explainClassification } from "@/lib/calculations/explainClassification";
import type { DealFinancialResults } from "@/lib/calculations/types";
import type { DealAssumptions } from "@/types/deal";
import type { RealOfferDealScore } from "@/lib/investmentAnalysis/types";

type SummaryPanelProps = {
  arvCents: number;
  repairCents: number;
  results: DealFinancialResults;
  assumptions: DealAssumptions;
  hasSufficientPropertyInfo: boolean;
  dealScore: RealOfferDealScore | null;
  onSave: () => void;
  isSaving: boolean;
  justSaved: boolean;
};

type MetricTone = "neutral" | "accent" | "positive" | "negative";

const TONE_STYLES: Record<MetricTone, { border: string; bg: string; label: string; value: string }> = {
  neutral: { border: "border-border", bg: "bg-surface", label: "text-muted", value: "text-white" },
  accent: { border: "border-accent-3/25", bg: "bg-accent-3/[0.07]", label: "text-accent-3", value: "text-white" },
  positive: { border: "border-emerald-400/25", bg: "bg-emerald-400/[0.07]", label: "text-emerald-300/90", value: "text-emerald-300" },
  negative: { border: "border-red-400/25", bg: "bg-red-400/[0.07]", label: "text-red-300/90", value: "text-red-300" },
};

export function SummaryPanel({
  arvCents,
  repairCents,
  results,
  assumptions,
  hasSufficientPropertyInfo,
  dealScore,
  onSave,
  isSaving,
  justSaved,
}: SummaryPanelProps) {
  const isProfitNegative = results.projectedInvestorProfitCents < 0;

  const heroMetrics: Array<{ label: string; value: string; tone: MetricTone }> = [
    { label: "Expected ARV", value: formatCents(arvCents), tone: "neutral" },
    { label: "Estimated repairs", value: formatCents(repairCents), tone: "neutral" },
    { label: "Maximum allowable offer", value: formatCents(results.maximumAllowableOfferCents), tone: "accent" },
    {
      label: "Projected investor profit",
      value: formatCents(results.projectedInvestorProfitCents),
      tone: isProfitNegative ? "negative" : "positive",
    },
  ];

  const secondaryRows: Array<[string, string, boolean?]> = [
    ["Proposed contract price", formatCents(assumptions.contractPriceCents)],
    ["End-buyer purchase price", formatCents(results.endBuyerPurchasePriceCents)],
    ["Desired assignment fee", formatCents(assumptions.desiredAssignmentFeeCents)],
    ["Buyer cushion", formatCents(results.remainingBuyerCushionCents), results.remainingBuyerCushionCents < 0],
  ];

  const explanation = explainClassification(results, hasSufficientPropertyInfo);

  return (
    <aside className="lg:sticky lg:top-6 rounded-2xl border border-border-strong bg-surface-2 p-6 flex flex-col gap-5 shadow-elevated">
      {dealScore ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted">RealOffer Deal Score</span>
          <DealScoreBadge score={dealScore.score} label={dealScore.label} labelText={dealScore.labelText} />
        </div>
      ) : null}

      <div>
        <p className="text-xs text-muted mb-2">Deal classification</p>
        <ClassificationBadge classification={results.dealClassification} />
        <details className="group mt-3">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-xs text-white/50 hover:text-white/80 transition-colors">
            Why this status?
            <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
          </summary>
          <ul className="mt-2 flex flex-col gap-1.5">
            {explanation.map((line, i) => (
              <li key={i} className="text-xs text-muted leading-relaxed">
                {line}
              </li>
            ))}
          </ul>
        </details>
      </div>

      <div className="h-px bg-border" />

      <div>
        <p className="text-xs text-muted mb-2.5">Key numbers</p>
        <div className="grid grid-cols-2 auto-rows-fr gap-2.5">
          {heroMetrics.map((metric) => {
            const tone = TONE_STYLES[metric.tone];
            return (
              <div
                key={metric.label}
                className={`flex min-w-0 flex-col justify-between rounded-xl border ${tone.border} ${tone.bg} p-3.5 transition-colors duration-200`}
              >
                <p className={`text-[11px] leading-tight ${tone.label}`}>{metric.label}</p>
                <p className={`mt-2 text-lg font-semibold tabular-nums truncate ${tone.value}`}>{metric.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-border" />

      <dl className="flex flex-col gap-3">
        {secondaryRows.map(([label, value, negative]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className={`text-sm font-semibold tabular-nums ${negative ? "text-red-400" : "text-white"}`}>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="h-px bg-border" />

      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="inline-flex items-center justify-center gap-2 h-11 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {justSaved ? <Check className="h-4 w-4" /> : null}
        {justSaved ? "Saved" : isSaving ? "Saving..." : "Save Deal"}
      </button>
      <p className="text-[11px] text-muted -mt-2 text-center">Saved to your account — accessible from any device you log in on.</p>
    </aside>
  );
}
