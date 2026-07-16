import { type LucideIcon } from "lucide-react";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
};

export function StatCard({ icon: Icon, label, value, hint }: StatCardProps) {
  return (
    <div className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-surface p-5 transition-colors duration-200 hover:border-border-strong">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted">{label}</span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] transition-colors duration-200 group-hover:bg-white/10">
          <Icon className="h-4 w-4 text-white/50" strokeWidth={1.75} />
        </span>
      </div>
      <div className="mt-4">
        <p className="text-[28px] leading-none font-semibold tracking-tight text-white tabular-nums">{value}</p>
        {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
      </div>
    </div>
  );
}
