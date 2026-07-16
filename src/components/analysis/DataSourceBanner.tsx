import { Info } from "lucide-react";
import type { PropertyDataSource } from "@/lib/property/types";

export function DataSourceBanner({ source }: { source: PropertyDataSource }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-accent-3/20 bg-accent-3/[0.06] px-4 py-3.5">
      <Info className="h-4 w-4 text-accent-3 mt-0.5 shrink-0" />
      {source === "rentcast" ? (
        <p className="text-xs sm:text-[13px] leading-relaxed text-white/70">
          <span className="font-medium text-white">Property and listing data is sourced from RentCast.</span> Public
          records and active listings can lag or contain gaps — fields RentCast doesn&apos;t report show as &quot;Not
          available&quot; rather than a guess. The estimated value, ARV, and comparable sales are estimates, not an
          appraisal, inspection, or guarantee of profit.
        </p>
      ) : (
        <p className="text-xs sm:text-[13px] leading-relaxed text-white/70">
          <span className="font-medium text-white">This analysis uses simulated demo data.</span> Property details,
          comparable sales, and repair suggestions are generated deterministically from the property address — they are
          not pulled from Zillow, RentCast, or any live data source. Treat every figure here as a rough estimate, not an
          appraisal, inspection, or guarantee of profit.
        </p>
      )}
    </div>
  );
}
