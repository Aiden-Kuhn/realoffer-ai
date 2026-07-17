import { Sparkles } from "lucide-react";
import type { DealScoreLabel } from "@/config/investmentAnalysis";

const STYLES: Record<DealScoreLabel, string> = {
  strong_candidate: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  worth_investigating: "border-accent-3/25 bg-accent-3/10 text-accent-3",
  negotiation_required: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  weak_candidate: "border-orange-400/25 bg-orange-400/10 text-orange-300",
  does_not_meet_targets: "border-red-400/25 bg-red-400/10 text-red-300",
};

type DealScoreBadgeProps = {
  score: number;
  label: DealScoreLabel;
  labelText: string;
  className?: string;
  compact?: boolean;
};

/** Deterministic RealOffer Deal Score badge — used anywhere a deal is
 * listed or summarized. Always reflects the same score computed by
 * lib/investmentAnalysis/dealScore.ts, never an AI-influenced value. */
export function DealScoreBadge({ score, label, labelText, className = "", compact = false }: DealScoreBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${STYLES[label]} ${className}`}
    >
      <Sparkles className="h-3 w-3 shrink-0" />
      {score}/100{compact ? "" : ` · ${labelText}`}
    </span>
  );
}
