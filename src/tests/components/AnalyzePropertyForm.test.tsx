// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnalyzePropertyForm } from "@/components/analyze/AnalyzePropertyForm";
import { analyzePropertyAddress } from "@/lib/property/providerSelection";
import { saveDraftDeal } from "@/lib/repositories/draftDealStore";
import { makeProperty } from "@/tests/investmentAnalysis/fixtures";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));
vi.mock("@/lib/property/providerSelection", () => ({
  analyzePropertyAddress: vi.fn(),
  getCurrentPropertyDataMode: vi.fn().mockResolvedValue("demo"),
}));
vi.mock("@/lib/repositories/settingsRepository", () => ({
  settingsRepository: { get: vi.fn().mockRejectedValue(new Error("no settings row in this test")) },
}));
vi.mock("@/lib/repositories/draftDealStore", () => ({ saveDraftDeal: vi.fn() }));

const VALID_ZILLOW_URL = "https://www.zillow.com/homedetails/1912-N-17th-St-Belleville-IL-62226/5271507_zpid/";
const DEAL_ID_PATTERN = /^\/dashboard\/deals\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AnalyzePropertyForm — listing link", () => {
  it("analyzes a valid Zillow link and redirects to the real generated deal id (never the literal '[id]')", async () => {
    vi.mocked(analyzePropertyAddress).mockResolvedValue({ status: "ok", property: makeProperty() });
    const user = userEvent.setup();
    render(<AnalyzePropertyForm />);

    await user.type(screen.getByLabelText("Zillow listing URL", { exact: false }), VALID_ZILLOW_URL);
    await user.click(screen.getByRole("button", { name: "Analyze Property" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalled());
    const destination = pushMock.mock.calls[0][0] as string;
    expect(destination).toMatch(DEAL_ID_PATTERN);
    expect(destination).not.toContain("[id]");
    expect(saveDraftDeal).toHaveBeenCalledTimes(1);
  });

  it("shows a loading state while the request is in flight and disables the submit button", async () => {
    let resolveAnalysis: (value: Awaited<ReturnType<typeof analyzePropertyAddress>>) => void = () => {};
    vi.mocked(analyzePropertyAddress).mockReturnValue(
      new Promise((resolve) => {
        resolveAnalysis = resolve;
      }),
    );
    const user = userEvent.setup();
    render(<AnalyzePropertyForm />);

    await user.type(screen.getByLabelText("Zillow listing URL", { exact: false }), VALID_ZILLOW_URL);
    await user.click(screen.getByRole("button", { name: "Analyze Property" }));

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Analyzing..." })).toBeDisabled();

    resolveAnalysis({ status: "ok", property: makeProperty() });
    await waitFor(() => expect(pushMock).toHaveBeenCalled());
  });

  it("prevents a duplicate submission while a request is already in flight", async () => {
    let resolveAnalysis: (value: Awaited<ReturnType<typeof analyzePropertyAddress>>) => void = () => {};
    vi.mocked(analyzePropertyAddress).mockReturnValue(
      new Promise((resolve) => {
        resolveAnalysis = resolve;
      }),
    );
    const user = userEvent.setup();
    render(<AnalyzePropertyForm />);

    await user.type(screen.getByLabelText("Zillow listing URL", { exact: false }), VALID_ZILLOW_URL);
    const button = screen.getByRole("button", { name: "Analyze Property" });
    await user.click(button);
    // The button is now disabled and re-labeled — a second click can't fire
    // a second submit. Assert only one analysis call was made.
    await user.click(screen.getByRole("button", { name: "Analyzing..." }));

    expect(analyzePropertyAddress).toHaveBeenCalledTimes(1);
    resolveAnalysis({ status: "ok", property: makeProperty() });
    await waitFor(() => expect(pushMock).toHaveBeenCalled());
  });

  it("on failure, keeps the user on the page, preserves the entered URL, and shows a retry option", async () => {
    vi.mocked(analyzePropertyAddress).mockResolvedValue({ status: "error", error: { code: "not_found", message: "not found" } });
    const user = userEvent.setup();
    render(<AnalyzePropertyForm />);

    const urlInput = screen.getByLabelText("Zillow listing URL", { exact: false }) as HTMLInputElement;
    await user.type(urlInput, VALID_ZILLOW_URL);
    await user.click(screen.getByRole("button", { name: "Analyze Property" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(pushMock).not.toHaveBeenCalled();
    expect(saveDraftDeal).not.toHaveBeenCalled();
    expect(urlInput.value).toBe(VALID_ZILLOW_URL);
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("retrying after a failure re-attempts the analysis and does not create two deals on eventual success", async () => {
    vi.mocked(analyzePropertyAddress).mockResolvedValueOnce({ status: "error", error: { code: "network_error", message: "network" } });
    const user = userEvent.setup();
    render(<AnalyzePropertyForm />);

    await user.type(screen.getByLabelText("Zillow listing URL", { exact: false }), VALID_ZILLOW_URL);
    await user.click(screen.getByRole("button", { name: "Analyze Property" }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());

    vi.mocked(analyzePropertyAddress).mockResolvedValueOnce({ status: "ok", property: makeProperty() });
    await user.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledTimes(1));
    expect(analyzePropertyAddress).toHaveBeenCalledTimes(2);
    expect(saveDraftDeal).toHaveBeenCalledTimes(1);
  });
});

describe("AnalyzePropertyForm — manual entry", () => {
  it("analyzes a manually-entered property and redirects to the real generated deal id", async () => {
    vi.mocked(analyzePropertyAddress).mockResolvedValue({ status: "ok", property: makeProperty() });
    const user = userEvent.setup();
    render(<AnalyzePropertyForm />);

    await user.click(screen.getByRole("tab", { name: "Enter Property Manually" }));
    await user.type(screen.getByLabelText("Street address", { exact: false }), "123 Main St");
    await user.type(screen.getByLabelText("City", { exact: false }), "Austin");
    await user.type(screen.getByLabelText("State", { exact: false }), "TX");
    await user.type(screen.getByLabelText("ZIP code", { exact: false }), "78701");
    await user.click(screen.getByRole("button", { name: "Analyze Property" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalled());
    expect((pushMock.mock.calls[0][0] as string)).toMatch(DEAL_ID_PATTERN);
  });
});
