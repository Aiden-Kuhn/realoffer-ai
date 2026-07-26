import type { ReactNode } from "react";

type LegalSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
};

/**
 * scroll-mt-24 keeps an anchor-linked heading from landing flush against
 * the viewport edge when jumped to from the table of contents.
 */
export function LegalSection({ id, title, children }: LegalSectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-24">
      <h2 id={headingId} className="text-lg sm:text-xl font-semibold tracking-tight text-white">
        {title}
      </h2>
      <div className="mt-3 flex flex-col gap-3 text-sm text-muted leading-relaxed">{children}</div>
    </section>
  );
}
