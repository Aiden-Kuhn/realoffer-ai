const DISCLAIMER_ITEMS = [
  "All property data is simulated during this demo — nothing is pulled from Zillow, the MLS, or any live data source.",
  "Every output here is an estimate, not an appraisal.",
  "This is not a property inspection.",
  "This is not legal advice.",
  "This is not financial or investment advice.",
  "This is not brokerage advice.",
  "Profit, financing, and closing are never guaranteed.",
];

export function Disclaimers() {
  return (
    <section className="rounded-2xl border border-border bg-surface-2 p-6">
      <h2 className="text-sm font-semibold text-white mb-3">Important disclaimers</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {DISCLAIMER_ITEMS.map((item) => (
          <li key={item} className="text-xs leading-relaxed text-muted flex gap-2">
            <span className="text-white/20">—</span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
