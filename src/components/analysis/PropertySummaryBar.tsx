"use client";

import { type ReactNode } from "react";
import { Check, FileSignature, Loader2 } from "lucide-react";
import { formatCents } from "@/lib/calculations/money";
import { DealScoreBadge } from "@/components/shared/DealScoreBadge";
import { ClassificationBadge } from "@/components/shared/ClassificationBadge";
import { PropertyHeader } from "@/components/analysis/PropertyHeader";
import type { PropertyRecord } from "@/lib/property/types";
import type { DealFinancialResults } from "@/lib/calculations/types";
import type { RealOfferDealScore } from "@/lib/investmentAnalysis/types";
import type { DealPipelineStatus } from "@/types/deal";

type PropertySummaryBarProps = {
  property: PropertyRecord;
  status: DealPipelineStatus;
  bedroomsOverride: number | null;
  bathroomsOverride: number | null;
  dealScore: RealOfferDealScore | null;
  results: DealFinancialResults | null;
  arvCents: number;
  isSaved: boolean;
  isSaving: boolean;
  justSaved: boolean;
  onSave: () => void;
  isCreatingContract: boolean;
  onCreateContract: () => void;
};

/**
 * The always-visible strip at the top of the Property Workspace — what the
 * property is, whether it's a good deal, and the two primary actions.
 * Never fetches anything itself; every value is already computed by
 * `DealWorkspace` (deal score, results, ARV) and passed straight through.
 */
export function PropertySummaryBar({
  property,
  status,
  bedroomsOverride,
  bathroomsOverride,
  dealScore,
  results,
  arvCents,
  isSaved,
  isSaving,
  justSaved,
  onSave,
  isCreatingContract,
  onCreateContract,
}: PropertySummaryBarProps) {
  return (
    <section className="rounded-2xl border border-border-strong bg-surface-2 p-6 shadow-elevated flex flex-col gap-5">
      <PropertyHeader property={property} status={status} bedroomsOverride={bedroomsOverride} bathroomsOverride={bathroomsOverride} />

      <div className="h-px bg-border" />

      <div className="flex flex-wrap items-stretch justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-stretch gap-2.5 min-w-0">
          <MetricChip label="RealOffer Deal Score">
            {dealScore ? (
              <DealScoreBadge score={dealScore.score} label={dealScore.label} labelText={dealScore.labelText} compact />
            ) : (
              <UnavailableValue />
            )}
          </MetricChip>
          <MetricChip label="Suggested Action">
            {results ? <ClassificationBadge classification={results.dealClassification} /> : <UnavailableValue />}
          </MetricChip>
          <MetricChip label="Estimated ARV">
            <span className="text-lg font-semibold tabular-nums text-white">{formatCents(arvCents)}</span>
          </MetricChip>
          <MetricChip label="Maximum Allowable Offer">
            {results ? (
              <span className="text-lg font-semibold tabular-nums text-white">{formatCents(results.maximumAllowableOfferCents)}</span>
            ) : (
              <UnavailableValue />
            )}
          </MetricChip>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || !results}
            className="inline-flex items-center justify-center gap-2 h-11 rounded-full bg-white px-5 text-sm font-medium text-black hover:bg-white/90 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {justSaved ? <Check className="h-4 w-4" /> : null}
            {justSaved ? "Saved" : isSaving ? "Saving..." : "Save Property"}
          </button>
          {isSaved ? (
            <button
              type="button"
              onClick={onCreateContract}
              disabled={isCreatingContract}
              className="inline-flex items-center gap-2 h-11 rounded-full border border-border-strong px-5 text-sm font-medium text-white hover:bg-white/5 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isCreatingContract ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
              {isCreatingContract ? "Starting…" : "Generate Contract"}
            </button>
          ) : null}
        </div>
      </div>
      {!results ? <p className="text-xs text-amber-300/80 -mt-2">One of the assumption values is out of range — fix it in Deal Analysis to see Deal Score, Suggested Action, and Maximum Allowable Offer.</p> : null}
    </section>
  );
}

function MetricChip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-[9.5rem] flex-1 flex-col justify-between gap-2 rounded-xl border border-border bg-surface p-3.5 transition-colors duration-200 hover:border-border-strong">
      <p className="text-[11px] leading-tight text-muted">{label}</p>
      {children}
    </div>
  );
}

function UnavailableValue() {
  return <span className="text-lg font-semibold text-white/25">—</span>;
}
