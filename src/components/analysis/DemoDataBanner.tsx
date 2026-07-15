import { Info } from "lucide-react";

export function DemoDataBanner() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-accent-3/20 bg-accent-3/[0.06] px-4 py-3.5">
      <Info className="h-4 w-4 text-accent-3 mt-0.5 shrink-0" />
      <p className="text-xs sm:text-[13px] leading-relaxed text-white/70">
        <span className="font-medium text-white">This analysis uses simulated demo data.</span> Property details,
        comparable sales, and repair suggestions are generated deterministically from the property address — they are
        not pulled from Zillow, MLS, or any live data source. Treat every figure here as a rough estimate, not an
        appraisal, inspection, or guarantee of profit.
      </p>
    </div>
  );
}
