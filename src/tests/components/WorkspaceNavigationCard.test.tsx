// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Calculator } from "lucide-react";
import { WorkspaceNavigationCard } from "@/components/analysis/WorkspaceNavigationCard";

afterEach(() => cleanup());

function renderCard(overrides: Partial<Parameters<typeof WorkspaceNavigationCard>[0]> = {}) {
  const onSelect = vi.fn();
  render(
    <WorkspaceNavigationCard
      sectionKey="dealAnalysis"
      icon={Calculator}
      title="Deal Analysis"
      description="Offer calculations & assumptions"
      metric="$12,000"
      isActive={false}
      onSelect={onSelect}
      {...overrides}
    />,
  );
  return { onSelect };
}

describe("WorkspaceNavigationCard", () => {
  it("renders as a tab with the title, description, and metric", () => {
    renderCard();
    const tab = screen.getByRole("tab", { name: /Deal Analysis/ });
    expect(tab).toHaveTextContent("Deal Analysis");
    expect(tab).toHaveTextContent("Offer calculations & assumptions");
    expect(tab).toHaveTextContent("$12,000");
  });

  it("is clickable across the full card — clicking anywhere fires onSelect", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderCard();
    await user.click(screen.getByRole("tab", { name: /Deal Analysis/ }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("activates via keyboard (Enter) since it renders as a real button", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderCard();
    const tab = screen.getByRole("tab", { name: /Deal Analysis/ });
    tab.focus();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("activates via keyboard (Space) since it renders as a real button", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderCard();
    const tab = screen.getByRole("tab", { name: /Deal Analysis/ });
    tab.focus();
    await user.keyboard(" ");
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("marks the active card with aria-selected and includes it in the accessible name", () => {
    renderCard({ isActive: true });
    const tab = screen.getByRole("tab", { name: /Deal Analysis \(selected\)/ });
    expect(tab).toHaveAttribute("aria-selected", "true");
    expect(tab).toHaveAttribute("tabindex", "0");
  });

  it("marks an inactive card as not selected and removes it from tab order", () => {
    renderCard({ isActive: false });
    const tab = screen.getByRole("tab", { name: "Deal Analysis" });
    expect(tab).toHaveAttribute("aria-selected", "false");
    expect(tab).toHaveAttribute("tabindex", "-1");
  });

  it("links the card to its section panel via aria-controls for screen readers", () => {
    renderCard({ sectionKey: "risks" });
    const tab = screen.getByRole("tab");
    expect(tab).toHaveAttribute("aria-controls", "workspace-panel-risks");
    expect(tab).toHaveAttribute("id", "workspace-tab-risks");
  });

  it("renders only the one-line description when no metric is given (Risks/Contract style)", () => {
    renderCard({ metric: undefined, description: "2 Issues Found" });
    const tab = screen.getByRole("tab");
    expect(tab).toHaveTextContent("2 Issues Found");
  });
});
