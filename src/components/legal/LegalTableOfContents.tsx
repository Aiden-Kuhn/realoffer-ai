export type LegalTocEntry = { id: string; title: string };

type LegalTableOfContentsProps = {
  sections: LegalTocEntry[];
};

/**
 * Desktop-only (hidden below lg) — on a document this long a jump-to-section
 * list is worth the width, but on mobile it would just push the actual text
 * further down the page for no benefit over normal scrolling.
 */
export function LegalTableOfContents({ sections }: LegalTableOfContentsProps) {
  return (
    <nav aria-label="Table of contents" className="hidden lg:block sticky top-8 w-64 shrink-0 self-start rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">On this page</h2>
      <ul className="mt-3 flex flex-col gap-0.5">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="block rounded-lg px-2.5 py-1.5 text-sm text-muted hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
