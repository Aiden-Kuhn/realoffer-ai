"use client";

import { CurrencyField, PercentField } from "@/components/shared/CurrencyField";
import type { DealAssumptions } from "@/types/deal";
import type { MaoMethod } from "@/lib/calculations/types";

type AssumptionsFormProps = {
  assumptions: DealAssumptions;
  onChange: (next: DealAssumptions) => void;
};

function update<K extends keyof DealAssumptions>(
  assumptions: DealAssumptions,
  onChange: (next: DealAssumptions) => void,
  key: K,
) {
  return (value: DealAssumptions[K]) => onChange({ ...assumptions, [key]: value });
}

export function AssumptionsForm({ assumptions, onChange }: AssumptionsFormProps) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-white">Editable assumptions</h2>
      </div>
      <p className="text-xs text-muted mb-5">Every field below recalculates the analysis immediately.</p>

      <div className="mb-5">
        <span className="block text-sm font-medium text-white/80 mb-2">Maximum allowable offer method</span>
        <div className="inline-flex rounded-xl border border-border bg-surface-2 p-1">
          {(
            [
              { value: "PERCENTAGE_OF_ARV", label: "% of ARV" },
              { value: "TARGET_PROFIT", label: "Target Profit" },
            ] as Array<{ value: MaoMethod; label: string }>
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update(assumptions, onChange, "maoMethod")(opt.value)}
              aria-pressed={assumptions.maoMethod === opt.value}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                assumptions.maoMethod === opt.value ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          {assumptions.maoMethod === "PERCENTAGE_OF_ARV"
            ? "A common rule of thumb, not a universal standard — MAO = (ARV x Investor ARV%) - repairs - other investor costs - assignment fee."
            : "MAO = ARV - total investor costs - desired investor profit - assignment fee."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CurrencyField
          id="contractPrice"
          label="Proposed contract price"
          valueCents={assumptions.contractPriceCents}
          onChangeCents={update(assumptions, onChange, "contractPriceCents")}
        />
        <CurrencyField
          id="assignmentFee"
          label="Desired assignment fee"
          valueCents={assumptions.desiredAssignmentFeeCents}
          onChangeCents={update(assumptions, onChange, "desiredAssignmentFeeCents")}
        />

        {assumptions.maoMethod === "PERCENTAGE_OF_ARV" ? (
          <PercentField
            id="investorArvPct"
            label="Investor ARV percentage"
            valueFraction={assumptions.investorArvPercentage}
            onChangeFraction={update(assumptions, onChange, "investorArvPercentage")}
            hint="Rule-of-thumb default: 70%"
          />
        ) : (
          <CurrencyField
            id="investorTargetProfit"
            label="Investor target profit"
            valueCents={assumptions.investorTargetProfitCents}
            onChangeCents={update(assumptions, onChange, "investorTargetProfitCents")}
          />
        )}

        <CurrencyField
          id="buyerClosingCosts"
          label="Buyer closing costs"
          valueCents={assumptions.buyerClosingCostsCents}
          onChangeCents={update(assumptions, onChange, "buyerClosingCostsCents")}
        />
        <CurrencyField
          id="holdingCosts"
          label="Holding costs"
          valueCents={assumptions.holdingCostsCents}
          onChangeCents={update(assumptions, onChange, "holdingCostsCents")}
        />
        <CurrencyField
          id="financingCosts"
          label="Financing costs"
          valueCents={assumptions.financingCostsCents}
          onChangeCents={update(assumptions, onChange, "financingCostsCents")}
        />
        <CurrencyField
          id="sellingCosts"
          label="Selling costs"
          valueCents={assumptions.sellingCostsCents}
          onChangeCents={update(assumptions, onChange, "sellingCostsCents")}
        />
      </div>
    </section>
  );
}
