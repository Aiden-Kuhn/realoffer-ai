export type SourceBadgeKind =
  | "provider_record"
  | "active_listing"
  | "automated_estimate"
  | "calculated"
  | "user_entered"
  | "unavailable"
  | "demo";

const LABELS: Record<SourceBadgeKind, string> = {
  provider_record: "Provider record",
  active_listing: "Active listing",
  automated_estimate: "Automated estimate",
  calculated: "Calculated",
  user_entered: "User-entered",
  unavailable: "Unavailable",
  demo: "Demo",
};

const STYLES: Record<SourceBadgeKind, string> = {
  provider_record: "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300/85",
  active_listing: "border-sky-400/15 bg-sky-400/[0.07] text-sky-300/85",
  automated_estimate: "border-violet-400/15 bg-violet-400/[0.07] text-violet-300/85",
  calculated: "border-accent-3/15 bg-accent-3/[0.07] text-accent-3/85",
  user_entered: "border-white/10 bg-white/[0.04] text-white/55",
  unavailable: "border-white/8 bg-white/[0.02] text-white/30",
  demo: "border-amber-400/15 bg-amber-400/[0.07] text-amber-300/85",
};

export function SourceBadge({ kind, className = "" }: { kind: SourceBadgeKind; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium tracking-wide whitespace-nowrap ${STYLES[kind]} ${className}`}
    >
      {LABELS[kind]}
    </span>
  );
}

/** Picks the right badge for a PropertyRecord-level field given the record's source and whether the field is populated. */
export function sourceBadgeForRecordField(
  source: "rentcast" | "simulated",
  value: unknown,
  when: { rentcast: SourceBadgeKind },
): SourceBadgeKind {
  if (source === "simulated") return "demo";
  if (value === null || value === undefined || value === "") return "unavailable";
  return when.rentcast;
}
