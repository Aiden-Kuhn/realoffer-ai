import { DEAL_CLASSIFICATION_LABELS, type DealClassification } from "@/config/dealClassification";

const CLASSIFICATION_STYLES: Record<DealClassification, string> = {
  strong_margin: "bg-emerald-400/10 text-emerald-300 border-emerald-400/25",
  potential_deal: "bg-accent-3/10 text-accent-3 border-accent-3/25",
  thin_margin: "bg-amber-400/10 text-amber-300 border-amber-400/25",
  does_not_meet_targets: "bg-red-400/10 text-red-300 border-red-400/25",
  insufficient_information: "bg-white/8 text-white/60 border-white/10",
};

export function ClassificationBadge({ classification }: { classification: DealClassification }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold whitespace-nowrap ${CLASSIFICATION_STYLES[classification]}`}
    >
      {DEAL_CLASSIFICATION_LABELS[classification]}
    </span>
  );
}
