import { DEAL_PIPELINE_STATUS_LABELS, type DealPipelineStatus } from "@/types/deal";

const STATUS_STYLES: Record<DealPipelineStatus, string> = {
  draft: "bg-white/8 text-white/60 border-white/10",
  analyzing: "bg-accent-3/10 text-accent-3 border-accent-3/25",
  potential: "bg-accent/10 text-accent border-accent/25",
  pursuing: "bg-violet-400/10 text-violet-300 border-violet-400/25",
  under_contract: "bg-amber-400/10 text-amber-300 border-amber-400/25",
  assigned: "bg-emerald-400/10 text-emerald-300 border-emerald-400/25",
  closed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  passed: "bg-red-400/10 text-red-300 border-red-400/25",
};

export function StatusBadge({ status }: { status: DealPipelineStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${STATUS_STYLES[status]}`}
    >
      {DEAL_PIPELINE_STATUS_LABELS[status]}
    </span>
  );
}
