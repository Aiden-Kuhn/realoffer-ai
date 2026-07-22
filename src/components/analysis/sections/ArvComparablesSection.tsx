"use client";

import { ArvPanel } from "@/components/analysis/ArvPanel";
import { ComparablesTable } from "@/components/analysis/ComparablesTable";
import type { ComparableSale, PropertyRecord } from "@/lib/property/types";

type ArvComparablesSectionProps = {
  property: PropertyRecord;
  comparables: ComparableSale[];
  onChangeComparables: (next: ComparableSale[]) => void;
  arvOverrideCents: number | null;
  onChangeArvOverride: (cents: number | null) => void;
};

export function ArvComparablesSection({
  property,
  comparables,
  onChangeComparables,
  arvOverrideCents,
  onChangeArvOverride,
}: ArvComparablesSectionProps) {
  return (
    <div className="flex flex-col gap-6">
      <ArvPanel property={property} comparables={comparables} arvOverrideCents={arvOverrideCents} onChangeOverride={onChangeArvOverride} />
      <ComparablesTable comparables={comparables} onChange={onChangeComparables} />
    </div>
  );
}
