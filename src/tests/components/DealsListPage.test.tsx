// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DealsListPage } from "@/components/deals/DealsListPage";
import { makeStrongDealFixtures } from "@/tests/investmentAnalysis/fixtures";
import type { Deal } from "@/types/deal";

// jsdom doesn't implement <dialog> — ConfirmDialog relies on showModal/close.
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute("open");
};

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));
vi.mock("@/components/dashboard/PageHeaderContext", () => ({ useSetPageHeader: () => {} }));

const deleteDealMock = vi.fn().mockResolvedValue(undefined);
let mockDeals: Deal[] = [];
vi.mock("@/hooks/useDeals", () => ({
  useDeals: () => ({ deals: mockDeals, isLoading: false, deleteDeal: deleteDealMock }),
}));

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
  mockDeals = [];
});

describe("DealsListPage — empty state", () => {
  it("shows a single 'Analyze Property' CTA and no search/filter/sort bar when there are no saved deals", () => {
    mockDeals = [];
    render(<DealsListPage />);
    expect(screen.getByText("No saved deals yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Analyze Property/ })).toHaveAttribute("href", "/analyze");
    expect(screen.queryByLabelText("Search saved deals")).not.toBeInTheDocument();
  });
});

describe("DealsListPage — search, filter, sort", () => {
  it("filters the visible deals by search query", async () => {
    mockDeals = [
      makeDeal({
        id: "1",
        property: {
          ...makeDeal().property,
          address: { ...makeDeal().property.address, line1: "3509 Steinberg Farm Rd", formatted: "3509 STEINBERG FARM RD, AUSTIN, TX 78701" },
        },
      }),
      makeDeal({
        id: "2",
        property: {
          ...makeDeal().property,
          address: { ...makeDeal().property.address, line1: "428 Maple Ridge Dr", formatted: "428 MAPLE RIDGE DR, AUSTIN, TX 78701" },
        },
      }),
    ];
    const user = userEvent.setup();
    render(<DealsListPage />);

    const table = screen.getByRole("table");
    expect(within(table).getByText("3509 Steinberg Farm Rd")).toBeInTheDocument();
    expect(within(table).getByText("428 Maple Ridge Dr")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Search saved deals"), "Maple");

    expect(within(table).queryByText("3509 Steinberg Farm Rd")).not.toBeInTheDocument();
    expect(within(table).getByText("428 Maple Ridge Dr")).toBeInTheDocument();
  });

  it("filters the visible deals by status", async () => {
    mockDeals = [makeDeal({ id: "1", status: "ready" }), makeDeal({ id: "2", status: "under_contract" })];
    const user = userEvent.setup();
    render(<DealsListPage />);

    await user.selectOptions(screen.getByLabelText("Filter by status"), "under_contract");

    const table = screen.getByRole("table");
    expect(within(table).getByText("Under Contract")).toBeInTheDocument();
    expect(within(table).queryByText("Ready")).not.toBeInTheDocument();
  });

  it("shows a 'no matching deals' message when search/filter yields nothing", async () => {
    mockDeals = [makeDeal({ id: "1" })];
    const user = userEvent.setup();
    render(<DealsListPage />);

    await user.type(screen.getByLabelText("Search saved deals"), "no such address anywhere");

    expect(screen.getByText("No matching deals")).toBeInTheDocument();
  });

  it("toggles sort direction via the compact icon button (no Asc/Desc dropdown)", async () => {
    mockDeals = [makeDeal({ id: "1" })];
    const user = userEvent.setup();
    render(<DealsListPage />);

    expect(screen.queryByLabelText(/^sort direction$/i)).not.toBeInTheDocument();
    const toggle = screen.getByLabelText("Sorted descending — click to sort ascending");
    await user.click(toggle);
    expect(screen.getByLabelText("Sorted ascending — click to sort descending")).toBeInTheDocument();
  });
});

describe("DealsListPage — deleting a deal", () => {
  it("confirms before deleting, then calls deleteDeal with the right id", async () => {
    mockDeals = [makeDeal({ id: "deal-xyz" })];
    const user = userEvent.setup();
    render(<DealsListPage />);

    await user.click(within(screen.getByRole("table")).getByRole("button", { name: /Delete/ }));
    expect(screen.getByText("Delete this deal?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(deleteDealMock).toHaveBeenCalledWith("deal-xyz"));
  });
});
