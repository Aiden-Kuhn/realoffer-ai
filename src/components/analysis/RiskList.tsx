import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { RiskItem } from "@/lib/calculations/risks";

const SEVERITY_ICON = { high: AlertTriangle, medium: AlertCircle, low: Info } as const;
const SEVERITY_STYLE = {
  high: { icon: "text-red-400", border: "border-red-400/15", bg: "bg-red-400/[0.04]" },
  medium: { icon: "text-amber-400", border: "border-amber-400/15", bg: "bg-amber-400/[0.04]" },
  low: { icon: "text-white/40", border: "border-border", bg: "bg-surface-2" },
} as const;

export function RiskList({ risks }: { risks: RiskItem[] }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-sm font-semibold text-white mb-4">Risks and missing information</h2>
      {risks.length === 0 ? (
        <p className="text-sm text-muted">No notable risks flagged by the current assumptions and data.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {risks.map((risk, i) => {
            const Icon = SEVERITY_ICON[risk.severity];
            const style = SEVERITY_STYLE[risk.severity];
            return (
              <li
                key={i}
                className={`flex items-start gap-2.5 rounded-lg border ${style.border} ${style.bg} px-3.5 py-2.5 text-sm text-white/70`}
              >
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${style.icon}`} />
                {risk.message}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
