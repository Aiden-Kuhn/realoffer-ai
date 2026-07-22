// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DealWorkspace } from "@/components/analysis/DealWorkspace";
import { useDeal } from "@/hooks/useDeal";
import { analyzePropertyAddress } from "@/lib/property/providerSelection";
import { dealRepository } from "@/lib/repositories/dealRepository";
import { buyerProfileRepository } from "@/lib/repositories/buyerProfileRepository";
import { contractDefaultsRepository } from "@/lib/repositories/contractDefaultsRepository";
import { makeStrongDealFixtures } from "@/tests/investmentAnalysis/fixtures";
import type { Deal } from "@/types/deal";

/**
 * Mocks every dependency of DealWorkspace that isn't the thing under test:
 * routing, auth, page-header context, and every repository. `useDeal` is a
 * real vi.fn() the test configures per-case so the "deal" it returns is a
 * fresh, fully-formed fixture built with the same helpers the rest of the
 * suite uses — no network, no Supabase, no AI provider involved.
 */
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/auth/AuthProvider", () => ({ useAuth: () => ({ user: { email: "buyer@example.com" } }) }));
vi.mock("@/components/dashboard/PageHeaderContext", () => ({ useSetPageHeader: () => undefined }));
vi.mock("@/hooks/useMounted", () => ({ useMounted: () => true }));
vi.mock("@/hooks/useDeal", () => ({ useDeal: vi.fn() }));
vi.mock("@/lib/repositories/dealRepository", () => ({
  dealRepository: { save: vi.fn(), duplicate: vi.fn(), delete: vi.fn() },
}));
vi.mock("@/lib/repositories/buyerProfileRepository", () => ({
  buyerProfileRepository: { get: vi.fn() },
}));
vi.mock("@/lib/repositories/contractDefaultsRepository", () => ({
  contractDefaultsRepository: { getDueDiligenceDefaults: vi.fn() },
}));
vi.mock("@/lib/repositories/contractRepository", () => ({
  contractRepository: { create: vi.fn() },
}));
vi.mock("@/lib/repositories/draftDealStore", () => ({ clearDraftDeal: vi.fn() }));
vi.mock("@/lib/property/providerSelection", () => ({ analyzePropertyAddress: vi.fn() }));
// The AI Investment Analyst has its own extensive, dedicated test suite
// (src/tests/investmentAnalysis/**) — stubbed here so these tests exercise
// workspace section-switching, not AI generation machinery.
vi.mock("@/components/analysis/InvestmentAnalyst", () => ({
  InvestmentAnalyst: () => <div data-testid="investment-analyst-stub">Investment Analyst</div>,
}));

function makeMockDeal(overrides: Partial<Deal> = {}): Deal {
  const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
  return {
    id: "deal-workspace-test",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    status: "draft",
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

async function renderWorkspace(deal: Deal = makeMockDeal()) {
  vi.mocked(useDeal).mockReturnValue({ deal, isSaved: true, isLoading: false });
  vi.mocked(buyerProfileRepository.get).mockResolvedValue(null);
  vi.mocked(contractDefaultsRepository.getDueDiligenceDefaults).mockResolvedValue(null);
  const user = userEvent.setup();
  render(<DealWorkspace id={deal.id} />);
  return { user, deal };
}

function tab(name: RegExp | string) {
  return screen.getByRole("tab", { name });
}

beforeEach(() => {
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DealWorkspace — section switching", () => {
  it("defaults to Deal Analysis for a deal with no remembered section", async () => {
    await renderWorkspace();
    expect(tab(/Deal Analysis/)).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: "Deal Analysis", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("Editable assumptions")).toBeInTheDocument();
  });

  it("renders only the selected section's content — never more than one at a time", async () => {
    const { user } = await renderWorkspace();

    // Deal Analysis content present, every other section's unique content absent.
    expect(screen.getByText("Editable assumptions")).toBeInTheDocument();
    expect(screen.queryByText("Comparable sales")).not.toBeInTheDocument();
    expect(screen.queryByText("Repair estimator")).not.toBeInTheDocument();
    expect(screen.queryByText("Property overview")).not.toBeInTheDocument();
    expect(screen.queryByText("Risks and missing information")).not.toBeInTheDocument();
    expect(screen.queryByText("Purchase agreement")).not.toBeInTheDocument();

    await user.click(tab(/ARV & Comparable Sales/));

    expect(screen.getByText("Comparable sales")).toBeInTheDocument();
    expect(screen.queryByText("Editable assumptions")).not.toBeInTheDocument();
    expect(screen.queryByText("Repair estimator")).not.toBeInTheDocument();
    expect(screen.queryByText("Property overview")).not.toBeInTheDocument();
    expect(screen.queryByText("Risks and missing information")).not.toBeInTheDocument();
    expect(screen.queryByText("Purchase agreement")).not.toBeInTheDocument();
  });

  it("switches correctly through all six cards, showing only that section's content each time", async () => {
    const { user } = await renderWorkspace();

    const expectations: Array<{ cardName: RegExp; uniqueText: string }> = [
      { cardName: /ARV & Comparable Sales/, uniqueText: "Comparable sales" },
      { cardName: /Repair Estimate/, uniqueText: "Repair estimator" },
      { cardName: /Property Details/, uniqueText: "Property overview" },
      { cardName: /^Risks/, uniqueText: "Risks and missing information" },
      { cardName: /Contract/, uniqueText: "Purchase agreement" },
      { cardName: /Deal Analysis/, uniqueText: "Editable assumptions" },
    ];

    for (const { cardName, uniqueText } of expectations) {
      await user.click(tab(cardName));
      expect(screen.getByText(uniqueText)).toBeInTheDocument();
      const others = expectations.filter((e) => e.uniqueText !== uniqueText);
      for (const other of others) {
        expect(screen.queryByText(other.uniqueText)).not.toBeInTheDocument();
      }
    }
  });

  it("hides Risks content whenever a different section is selected", async () => {
    const { user } = await renderWorkspace();
    await user.click(tab(/^Risks/));
    expect(screen.getByText("Risks and missing information")).toBeInTheDocument();
    await user.click(tab(/Deal Analysis/));
    expect(screen.queryByText("Risks and missing information")).not.toBeInTheDocument();
  });

  it("hides Contract content whenever a different section is selected", async () => {
    const { user } = await renderWorkspace();
    await user.click(tab(/Contract/));
    expect(screen.getByText("Purchase agreement")).toBeInTheDocument();
    await user.click(tab(/Deal Analysis/));
    expect(screen.queryByText("Purchase agreement")).not.toBeInTheDocument();
  });

  it("activates a card via keyboard alone (Enter)", async () => {
    const { user } = await renderWorkspace();
    tab(/Repair Estimate/).focus();
    await user.keyboard("{Enter}");
    expect(screen.getByText("Repair estimator")).toBeInTheDocument();
    expect(tab(/Repair Estimate/)).toHaveAttribute("aria-selected", "true");
  });
});

describe("DealWorkspace — remembering the selected section across visits", () => {
  it("reopens the last section a deal was on after unmount/remount (simulating navigating away and back)", async () => {
    const deal = makeMockDeal();
    const { user } = await renderWorkspace(deal);
    await user.click(tab(/^Risks/));
    expect(screen.getByText("Risks and missing information")).toBeInTheDocument();

    cleanup();
    vi.mocked(useDeal).mockReturnValue({ deal, isSaved: true, isLoading: false });
    render(<DealWorkspace id={deal.id} />);

    expect(tab(/^Risks/)).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Risks and missing information")).toBeInTheDocument();
  });

  it("does not leak a remembered section from one deal onto a different deal", async () => {
    const dealA = makeMockDeal({ id: "deal-a" });
    const dealB = makeMockDeal({ id: "deal-b" });

    const { user } = await renderWorkspace(dealA);
    await user.click(tab(/Contract/));
    cleanup();

    vi.mocked(useDeal).mockReturnValue({ deal: dealB, isSaved: true, isLoading: false });
    render(<DealWorkspace id={dealB.id} />);

    expect(tab(/Deal Analysis/)).toHaveAttribute("aria-selected", "true");
  });
});

describe("DealWorkspace — state preservation while switching sections", () => {
  it("preserves an edited assumption across a section switch", async () => {
    const { user } = await renderWorkspace();
    const priceInput = screen.getByLabelText("Proposed contract price") as HTMLInputElement;
    await user.clear(priceInput);
    await user.type(priceInput, "199000");
    expect(priceInput).toHaveValue(199000);

    await user.click(tab(/ARV & Comparable Sales/));
    await user.click(tab(/Deal Analysis/));

    expect(screen.getByLabelText("Proposed contract price")).toHaveValue(199000);
  });

  it("preserves comparable include/exclude selection across a section switch", async () => {
    const { user, deal } = await renderWorkspace();
    await user.click(tab(/ARV & Comparable Sales/));

    const firstComparable = deal.comparables[0];
    const checkbox = screen.getByRole("checkbox", { name: new RegExp(`Include ${firstComparable.address}`) }) as HTMLInputElement;
    const wasChecked = checkbox.checked;
    await user.click(checkbox);
    expect(checkbox.checked).toBe(!wasChecked);

    await user.click(tab(/Deal Analysis/));
    await user.click(tab(/ARV & Comparable Sales/));

    const checkboxAfter = screen.getByRole("checkbox", { name: new RegExp(`Include ${firstComparable.address}`) }) as HTMLInputElement;
    expect(checkboxAfter.checked).toBe(!wasChecked);
  });

  it("preserves an edited manual repair total across a section switch", async () => {
    const { user } = await renderWorkspace();
    await user.click(tab(/Repair Estimate/));

    const manualInput = screen.getByRole("spinbutton") as HTMLInputElement;
    await user.clear(manualInput);
    await user.type(manualInput, "45000");
    expect(manualInput).toHaveValue(45000);

    await user.click(tab(/Deal Analysis/));
    await user.click(tab(/Repair Estimate/));

    expect(screen.getByRole("spinbutton")).toHaveValue(45000);
  });
});

describe("DealWorkspace — no unnecessary work when switching sections", () => {
  it("never refetches property data just from switching between sections", async () => {
    const { user } = await renderWorkspace();
    for (const name of [/ARV & Comparable Sales/, /Repair Estimate/, /Property Details/, /^Risks/, /Contract/, /Deal Analysis/]) {
      await user.click(tab(name));
    }
    expect(analyzePropertyAddress).not.toHaveBeenCalled();
    expect(dealRepository.save).not.toHaveBeenCalled();
  });
});

describe("DealWorkspace — layout", () => {
  it("keeps the summary bar and nav cards mounted regardless of which section is active", async () => {
    const { user } = await renderWorkspace();
    const summary = screen.getByText("RealOffer Deal Score").closest("section");
    expect(summary).toBeInTheDocument();
    await user.click(tab(/Contract/));
    expect(within(summary!).getByText("RealOffer Deal Score")).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "Property workspace sections" })).toBeInTheDocument();
  });
});
