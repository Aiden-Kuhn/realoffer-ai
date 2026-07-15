"use client";

import Link from "next/link";
import { ChevronRight, Menu, Plus } from "lucide-react";
import { usePageHeader } from "@/components/dashboard/PageHeaderContext";

type TopBarProps = {
  onOpenMobileNav: () => void;
};

export function TopBar({ onOpenMobileNav }: TopBarProps) {
  const { title, breadcrumbs } = usePageHeader();

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface/60 px-4 sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
        className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/5 shrink-0"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted mb-0.5">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb} className="flex items-center gap-1.5">
                {i > 0 ? <ChevronRight className="h-3 w-3" /> : null}
                {crumb}
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className="truncate text-[15px] font-semibold text-white">{title}</h1>
      </div>

      <Link
        href="/dashboard/analyze"
        className="hidden sm:inline-flex items-center gap-1.5 h-9 shrink-0 rounded-full bg-white px-4 text-sm font-medium text-black hover:bg-white/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Analyze New Deal
      </Link>
      <Link
        href="/dashboard/analyze"
        aria-label="Analyze new deal"
        className="sm:hidden flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shrink-0"
      >
        <Plus className="h-4 w-4" />
      </Link>
    </header>
  );
}
