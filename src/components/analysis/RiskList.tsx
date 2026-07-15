import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { RiskItem } from "@/lib/calculations/risks";

const SEVERITY_ICON = { high: AlertTriangle, medium: AlertCircle, low: Info } as const;
const SEVERITY_STYLE = {
  high: "text-red-400",
  medium: "text-amber-400",
  low: "text-white/40",
} as const;

export function RiskList({ risks }: { risks: RiskItem[] }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-sm font-semibold text-white mb-4">Risks and missing information</h2>
      {risks.length === 0 ? (
        <p className="text-sm text-muted">No notable risks flagged by the current assumptions and data.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {risks.map((risk, i) => {
            const Icon = SEVERITY_ICON[risk.severity];
            return (
              <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${SEVERITY_STYLE[risk.severity]}`} />
                {risk.message}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
