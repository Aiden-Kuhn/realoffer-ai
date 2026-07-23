// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DealsTable } from "@/components/deals/DealsTable";
import { makeStrongDealFixtures } from "@/tests/investmentAnalysis/fixtures";
import type { Deal } from "@/types/deal";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

function makeDeal(overrides: Partial<Deal> = {}): Deal {
  const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
  return {
    id: "deal-1",
    createdAt: "2026-07-21T00:00:00.000Z",
    updatedAt: "2026-07-21T00:00:00.000Z",
    status: "ready",
    notes: "",
    property,
    comparables,
    assumptions,
    repairEstimate,
    results,
    dataMode: "real",
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DealsTable — trimmed columns", () => {
  it("shows only the address, deal score, max offer, profit, status, and analyzed date", () => {
    render(<DealsTable deals={[makeDeal()]} onDeleteRequest={vi.fn()} />);
    expect(screen.getByRole("columnheader", { name: "Property" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Deal score" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Max offer" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Profit" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Analyzed" })).toBeInTheDocument();
  });

  it("never shows ARV, Repairs, Contract price, or Assignment fee — those live in the Property Workspace now", () => {
    render(<DealsTable deals={[makeDeal()]} onDeleteRequest={vi.fn()} />);
    for (const removed of ["ARV", "Repairs", "Contract", "Assignment fee"]) {
      expect(screen.queryByRole("columnheader", { name: removed })).not.toBeInTheDocument();
    }
  });
});

describe("DealsTable — opening a deal", () => {
  it("clicking anywhere on the row (not the delete button) opens the deal", async () => {
    const user = userEvent.setup();
    render(<DealsTable deals={[makeDeal({ id: "deal-abc" })]} onDeleteRequest={vi.fn()} />);
    // Click a non-interactive cell (the status badge), not the address link itself.
    await user.click(screen.getByText("Ready"));
    expect(pushMock).toHaveBeenCalledWith("/dashboard/deals/deal-abc");
  });

  it("the address itself is a real link to the deal (keyboard-accessible independent of the row click)", () => {
    render(<DealsTable deals={[makeDeal({ id: "deal-abc" })]} onDeleteRequest={vi.fn()} />);
    expect(screen.getByRole("link", { name: /123 Main St/ })).toHaveAttribute("href", "/dashboard/deals/deal-abc");
  });

  it("clicking the delete button does not also navigate to the deal", async () => {
    const user = userEvent.setup();
    const onDeleteRequest = vi.fn();
    render(<DealsTable deals={[makeDeal({ id: "deal-abc" })]} onDeleteRequest={onDeleteRequest} />);
    await user.click(screen.getByRole("button", { name: /Delete/ }));
    expect(onDeleteRequest).toHaveBeenCalledWith("deal-abc");
    expect(pushMock).not.toHaveBeenCalled();
  });
});

describe("DealsTable — status", () => {
  it("renders the Ready status distinctly from the legacy Analyzing status", () => {
    render(<DealsTable deals={[makeDeal({ status: "ready" })]} onDeleteRequest={vi.fn()} />);
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.queryByText("Analyzing")).not.toBeInTheDocument();
  });
});
