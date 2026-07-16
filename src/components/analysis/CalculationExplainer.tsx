import { ChevronDown } from "lucide-react";
import { explainDealFinancials } from "@/lib/calculations/explain";
import type { DealFinancialInputs, DealFinancialResults } from "@/lib/calculations/types";

export function CalculationExplainer({
  inputs,
  results,
}: {
  inputs: DealFinancialInputs;
  results: DealFinancialResults;
}) {
  const lines = explainDealFinancials(inputs, results);

  return (
    <section className="rounded-2xl border border-border bg-surface overflow-hidden">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.02]">
          How this was calculated
          <ChevronDown className="h-4 w-4 text-white/40 transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-6 pb-6 flex flex-col gap-3">
          {lines.map((line) => (
            <div
              key={line.label}
              className="rounded-xl border border-border bg-surface-2 px-4 py-3 transition-colors duration-200 hover:border-border-strong"
            >
              <p className="text-sm font-medium text-white">{line.label}</p>
              <p className="text-xs text-muted mt-1 font-mono">{line.formula}</p>
              <p className="text-xs text-white/50 mt-1 font-mono">{line.substituted}</p>
              <p className="text-sm font-semibold text-accent-3 mt-1.5">= {line.result}</p>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
