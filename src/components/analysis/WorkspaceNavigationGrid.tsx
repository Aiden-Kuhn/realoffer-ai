"use client";

import { WorkspaceNavigationCard, type WorkspaceCardMetricTone } from "@/components/analysis/WorkspaceNavigationCard";
import type { WorkspaceSectionKey } from "@/lib/repositories/workspaceSectionStore";
import type { LucideIcon } from "lucide-react";

export type WorkspaceCard = {
  key: WorkspaceSectionKey;
  icon: LucideIcon;
  title: string;
  description: string;
  metric?: string;
  metricTone?: WorkspaceCardMetricTone;
};

type WorkspaceNavigationGridProps = {
  cards: WorkspaceCard[];
  activeSection: WorkspaceSectionKey;
  onSelect: (key: WorkspaceSectionKey) => void;
};

/**
 * The section-switching mechanism for the Property Workspace: clicking a
 * card changes which section is rendered below (see DealWorkspace.tsx) —
 * no navigation, no refetch, and the card itself never renders section
 * content (see WorkspaceNavigationCard.tsx). Modeled as an ARIA tablist of
 * large cards rather than the small pill-tab pattern used elsewhere in the
 * app (see components/shared/Tabs.tsx), since these need room for an icon,
 * description, and live metric per card.
 */
export function WorkspaceNavigationGrid({ cards, activeSection, onSelect }: WorkspaceNavigationGridProps) {
  return (
    <div
      role="tablist"
      aria-label="Property workspace sections"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-3 sm:gap-4"
    >
      {cards.map((card) => (
        <WorkspaceNavigationCard
          key={card.key}
          sectionKey={card.key}
          icon={card.icon}
          title={card.title}
          description={card.description}
          metric={card.metric}
          metricTone={card.metricTone}
          isActive={card.key === activeSection}
          onSelect={() => onSelect(card.key)}
        />
      ))}
    </div>
  );
}
