const TRAILING_DISCLAIMER_ITEMS = [
  "Every output here is an estimate, not an appraisal.",
  "This is not a property inspection.",
  "This is not legal advice.",
  "This is not financial or investment advice.",
  "This is not brokerage advice.",
  "Profit, financing, and closing are never guaranteed.",
];

type DisclaimersProps = {
  /** Whether the property this deal is based on came from live RentCast
   * data (property.source === "rentcast") rather than simulated demo data.
   * Determines the first, data-provenance disclaimer line below. */
  isLiveData?: boolean;
};

export function Disclaimers({ isLiveData = false }: DisclaimersProps) {
  const dataSourceDisclaimer = isLiveData
    ? "Property data for this analysis was retrieved from RentCast. Third-party data may be incomplete, delayed, or inaccurate — confirm important details independently."
    : "Property data for this analysis is simulated demo data — nothing was pulled from Zillow, the MLS, or any live data source.";

  return (
    <section className="rounded-2xl border border-border bg-surface-2 p-6">
      <h2 className="text-sm font-semibold text-white mb-3">Important disclaimers</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {[dataSourceDisclaimer, ...TRAILING_DISCLAIMER_ITEMS].map((item) => (
          <li key={item} className="text-xs leading-relaxed text-muted flex gap-2">
            <span className="text-white/20">—</span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
