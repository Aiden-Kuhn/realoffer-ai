"use client";

import type { LucideIcon } from "lucide-react";

export type WorkspaceCardMetricTone = "neutral" | "positive" | "negative" | "warning";

const METRIC_TONE_CLASSES: Record<WorkspaceCardMetricTone, string> = {
  neutral: "text-white/80",
  positive: "text-emerald-300",
  negative: "text-red-300",
  warning: "text-amber-300",
};

type WorkspaceNavigationCardProps = {
  sectionKey: string;
  icon: LucideIcon;
  title: string;
  /** Always shown. For cards with nothing more granular to add (Risks,
   * Contract), this alone carries the "summary metric" the spec asks for —
   * e.g. "2 Issues Found" — rather than an empty second line. */
  description: string;
  metric?: string;
  metricTone?: WorkspaceCardMetricTone;
  isActive: boolean;
  onSelect: () => void;
};

/**
 * Navigation only — never renders section content itself. Clicking or
 * pressing Enter/Space anywhere in the card switches the active workspace
 * section (see DealWorkspace.tsx); it never fetches, calculates, or holds
 * its own state.
 */
export function WorkspaceNavigationCard({
  sectionKey,
  icon: Icon,
  title,
  description,
  metric,
  metricTone,
  isActive,
  onSelect,
}: WorkspaceNavigationCardProps) {
  return (
    <button
      id={`workspace-tab-${sectionKey}`}
      role="tab"
      type="button"
      aria-selected={isActive}
      aria-controls={`workspace-panel-${sectionKey}`}
      aria-label={`${title}${isActive ? " (selected)" : ""}`}
      tabIndex={isActive ? 0 : -1}
      onClick={onSelect}
      className={`group flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
        isActive
          ? "border-accent-3/60 bg-accent-3/[0.08] shadow-[0_0_0_1px_rgba(34,211,238,0.2)]"
          : "border-border bg-surface hover:border-border-strong"
      }`}
    >
      {isActive ? <span className="h-0.5 w-8 rounded-full bg-accent-3" aria-hidden="true" /> : null}
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${
          isActive ? "bg-accent-3/15 text-accent-3" : "bg-white/[0.04] text-white/50 group-hover:text-white/70"
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-muted leading-relaxed">{description}</p>
      </div>
      {metric ? (
        <p className={`mt-auto pt-1 text-sm font-semibold tabular-nums ${METRIC_TONE_CLASSES[metricTone ?? "neutral"]}`}>{metric}</p>
      ) : null}
    </button>
  );
}
