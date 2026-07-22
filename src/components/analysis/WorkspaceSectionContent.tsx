"use client";

import { useEffect, useRef, type ReactNode } from "react";

type WorkspaceSectionContentProps = {
  sectionKey: string;
  title: string;
  description?: string;
  children: ReactNode;
};

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The one place a selected section's title/description renders — a clean
 * wrapper, deliberately with no border or background of its own (the
 * detailed cards/tables/panels inside each section keep their own). On a
 * genuine section *switch* (not the initial mount), scrolls the heading
 * into view only if it isn't already visible — the nav cards above stay
 * put, and the whole page never jumps to the top.
 */
export function WorkspaceSectionContent({ sectionKey, title, description, children }: WorkspaceSectionContentProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const el = headingRef.current;
    if (!el || typeof el.scrollIntoView !== "function") return;

    const rect = el.getBoundingClientRect();
    const isInViewport = rect.top >= 0 && rect.top <= window.innerHeight - 80;
    if (isInViewport) return;

    el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  }, [sectionKey]);

  return (
    <div id={`workspace-panel-${sectionKey}`} role="tabpanel" aria-labelledby={`workspace-tab-${sectionKey}`} className="flex flex-col gap-5">
      <div>
        <h2 ref={headingRef} className="text-lg font-semibold text-white tracking-tight">
          {title}
        </h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
