"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { DataSourceBanner } from "@/components/analysis/DataSourceBanner";
import { PropertyOverview } from "@/components/analysis/PropertyOverview";
import type { PropertyRecord } from "@/lib/property/types";

type PropertyDetailsSectionProps = {
  property: PropertyRecord;
  bedroomsOverride: number | null;
  bathroomsOverride: number | null;
  onChangeBedroomsOverride: (value: number | null) => void;
  onChangeBathroomsOverride: (value: number | null) => void;
  isRefreshing: boolean;
  refreshError: string | null;
  onRefresh: () => void;
};

export function PropertyDetailsSection({
  property,
  bedroomsOverride,
  bathroomsOverride,
  onChangeBedroomsOverride,
  onChangeBathroomsOverride,
  isRefreshing,
  refreshError,
  onRefresh,
}: PropertyDetailsSectionProps) {
  return (
    <div className="flex flex-col gap-6">
      <DataSourceBanner source={property.source} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">
          Last retrieved {new Date(property.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 h-8 rounded-full border border-border px-3 text-xs font-medium text-white/70 hover:text-white hover:border-border-strong active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:active:scale-100"
        >
          {isRefreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {isRefreshing ? "Refreshing..." : "Refresh Property Data"}
        </button>
      </div>
      {refreshError ? <p className="text-xs text-red-400">{refreshError}</p> : null}

      <PropertyOverview
        property={property}
        bedroomsOverride={bedroomsOverride}
        bathroomsOverride={bathroomsOverride}
        onChangeBedroomsOverride={onChangeBedroomsOverride}
        onChangeBathroomsOverride={onChangeBathroomsOverride}
      />
    </div>
  );
}
