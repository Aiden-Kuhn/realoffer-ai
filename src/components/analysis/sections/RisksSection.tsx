"use client";

import { RiskList } from "@/components/analysis/RiskList";
import type { RiskItem } from "@/lib/calculations/risks";

type RisksSectionProps = {
  risks: RiskItem[];
  calculationError: string | null;
};

export function RisksSection({ risks, calculationError }: RisksSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      {calculationError ? (
        <p className="text-xs text-amber-300/80">
          Risks can&apos;t be fully evaluated until the calculation error in Deal Analysis is fixed.
        </p>
      ) : null}
      <RiskList risks={risks} />
    </div>
  );
}
