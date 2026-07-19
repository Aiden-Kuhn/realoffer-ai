"use client";

import { useFormContext } from "react-hook-form";
import { AlertTriangle } from "lucide-react";
import type { ContractFormData } from "@/lib/contracts/types";

export function AssignmentStep() {
  const { register } = useFormContext<ContractFormData>();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-sm font-semibold text-white mb-1">Wholesaling and Assignment</h2>
        <p className="text-xs text-muted">Shown because you intentionally added this section. Nothing here is included in the contract until you explicitly confirm it below.</p>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3.5 text-xs text-amber-100 leading-relaxed">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        Assignment and wholesaling language has specific legal and licensing implications that vary by state. Have this section reviewed by a licensed real estate attorney before use.
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3.5">
        <input type="checkbox" className="h-4 w-4 mt-0.5 rounded border-border" {...register("assignment.includeAssignmentClause")} />
        <span>
          <span className="block text-sm font-medium text-white">Include an assignment clause in this contract</span>
          <span className="block text-xs text-muted mt-0.5">Required — the options below have no effect unless this is checked.</span>
        </span>
      </label>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-white/80">Assignability *</p>
        <label className="flex items-center gap-2.5 text-sm text-white/80">
          <input type="radio" value="true" className="h-4 w-4 border-border" {...register("assignment.assignable", { setValueAs: (v) => v === "true" })} />
          Assignable agreement
        </label>
        <label className="flex items-center gap-2.5 text-sm text-white/80">
          <input type="radio" value="false" className="h-4 w-4 border-border" {...register("assignment.assignable", { setValueAs: (v) => v === "true" })} />
          Non-assignable agreement
        </label>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-white/80">
        <input type="checkbox" className="h-4 w-4 rounded border-border" {...register("assignment.buyerMayNominate")} />
        Buyer may nominate another purchasing entity
      </label>
      <label className="flex items-center gap-2.5 text-sm text-white/80">
        <input type="checkbox" className="h-4 w-4 rounded border-border" {...register("assignment.assignmentFeeExcludedFromContract")} />
        Assignment fee is not included inside this purchase contract
      </label>
      <label className="flex items-center gap-2.5 text-sm text-white/80">
        <input type="checkbox" className="h-4 w-4 rounded border-border" {...register("assignment.includeDoubleClosingNote")} />
        Include double-closing workflow note
      </label>
    </div>
  );
}
