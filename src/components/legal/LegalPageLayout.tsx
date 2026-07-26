import Link from "next/link";
import { Sparkles } from "lucide-react";
import { BackNavigationLink } from "@/components/legal/BackNavigationLink";
import { LegalTableOfContents, type LegalTocEntry } from "@/components/legal/LegalTableOfContents";
import { LEGAL_LAST_UPDATED } from "@/lib/legal/constants";
import type { ReactNode } from "react";

type LegalPageLayoutProps = {
  title: string;
  introduction: ReactNode;
  isAuthenticated: boolean;
  sections: LegalTocEntry[];
  children: ReactNode;
};

/**
 * Shared chrome for /privacy and /terms. Reuses the exact header pattern
 * already established on the Contact & Support page (centered brand mark,
 * centered h1 + subtext) so these read as the same product, just with a
 * wider two-column body (table of contents + document) instead of a single
 * centered column.
 */
export function LegalPageLayout({ title, introduction, isAuthenticated, sections, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-dvh bg-background px-4 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-5xl flex flex-col gap-10">
        <BackNavigationLink isAuthenticated={isAuthenticated} />

        <Link href="/" className="flex items-center gap-2 justify-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent via-accent-2 to-accent-3">
            <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            RealOffer <span className="text-muted font-normal">AI</span>
          </span>
        </Link>

        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">{title}</h1>
          <p className="mt-2 text-xs text-muted">
            Effective date: {LEGAL_LAST_UPDATED} &middot; Last updated: {LEGAL_LAST_UPDATED}
          </p>
          <p className="mt-4 text-sm sm:text-base text-muted leading-relaxed max-w-lg mx-auto">{introduction}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
          <LegalTableOfContents sections={sections} />
          <article className="min-w-0 flex-1 max-w-2xl mx-auto lg:mx-0 w-full rounded-2xl border border-border bg-surface p-6 sm:p-8 flex flex-col gap-10">
            {children}
          </article>
        </div>
      </div>
    </div>
  );
}
