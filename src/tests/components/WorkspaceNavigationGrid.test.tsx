// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertTriangle, BarChart3, Calculator, ClipboardList, FileSignature, Hammer } from "lucide-react";
import { WorkspaceNavigationGrid, type WorkspaceCard } from "@/components/analysis/WorkspaceNavigationGrid";
import type { WorkspaceSectionKey } from "@/lib/repositories/workspaceSectionStore";

afterEach(() => cleanup());

const CARDS: WorkspaceCard[] = [
  { key: "dealAnalysis", icon: Calculator, title: "Deal Analysis", description: "Offer calculations & assumptions", metric: "$12,000" },
  { key: "arvComparables", icon: BarChart3, title: "ARV & Comparable Sales", description: "12 comparable properties", metric: "Expected ARV $312,500" },
  { key: "repairEstimate", icon: Hammer, title: "Repair Estimate", description: "Moderate Rehab", metric: "Estimated $31,400" },
  { key: "propertyDetails", icon: ClipboardList, title: "Property Details", description: "3 bd • 2 ba • 1,800 sqft", metric: "RentCast data" },
  { key: "risks", icon: AlertTriangle, title: "Risks", description: "2 Issues Found" },
  { key: "contract", icon: FileSignature, title: "Contract", description: "Ready to Generate" },
];

describe("WorkspaceNavigationGrid", () => {
  it("renders all six workspace cards as a tablist", () => {
    render(<WorkspaceNavigationGrid cards={CARDS} activeSection="dealAnalysis" onSelect={vi.fn()} />);
    expect(screen.getByRole("tablist", { name: "Property workspace sections" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(6);
  });

  it("marks exactly one card as selected", () => {
    render(<WorkspaceNavigationGrid cards={CARDS} activeSection="repairEstimate" onSelect={vi.fn()} />);
    const tabs = screen.getAllByRole("tab");
    const selected = tabs.filter((tab) => tab.getAttribute("aria-selected") === "true");
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveAccessibleName(/Repair Estimate/);
  });

  it("calls onSelect with the clicked card's key for every card", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<WorkspaceNavigationGrid cards={CARDS} activeSection="dealAnalysis" onSelect={onSelect} />);

    for (const card of CARDS) {
      await user.click(screen.getByRole("tab", { name: new RegExp(card.title) }));
    }

    const calledKeys = onSelect.mock.calls.map((call) => call[0] as WorkspaceSectionKey);
    expect(calledKeys).toEqual(CARDS.map((c) => c.key));
  });

  it("does not render section content — only navigation metadata (title/description/metric)", () => {
    render(<WorkspaceNavigationGrid cards={CARDS} activeSection="dealAnalysis" onSelect={vi.fn()} />);
    // None of the deep, detail-only strings that only exist in the real
    // section components (e.g. a form field label) should ever appear here.
    expect(screen.queryByText(/Proposed contract price/)).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("uses a responsive grid: single column by default, growing at sm/lg breakpoints", () => {
    render(<WorkspaceNavigationGrid cards={CARDS} activeSection="dealAnalysis" onSelect={vi.fn()} />);
    const grid = screen.getByRole("tablist");
    expect(grid.className).toContain("grid-cols-1");
    expect(grid.className).toContain("sm:grid-cols-2");
    expect(grid.className).toContain("lg:grid-cols-3");
  });
});
