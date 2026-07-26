// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const getUserMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: getUserMock } })),
}));
// Stubbed so this test only exercises the server-side auth check and prop
// pass-through, not the legal pages' own (separately reviewed) content.
vi.mock("@/components/legal/PrivacyPolicyPage", () => ({
  PrivacyPolicyPage: (props: { isAuthenticated: boolean }) => <div data-testid="privacy-page">{JSON.stringify(props)}</div>,
}));
vi.mock("@/components/legal/TermsOfServicePage", () => ({
  TermsOfServicePage: (props: { isAuthenticated: boolean }) => <div data-testid="terms-page">{JSON.stringify(props)}</div>,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("/privacy — server-side auth awareness", () => {
  it("passes isAuthenticated: false for a logged-out visitor", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const PrivacyPage = (await import("@/app/privacy/page")).default;

    render(await PrivacyPage());

    expect(JSON.parse(screen.getByTestId("privacy-page").textContent ?? "{}")).toEqual({ isAuthenticated: false });
  });

  it("passes isAuthenticated: true for a signed-in visitor", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1", email: "jamie@example.com" } } });
    const PrivacyPage = (await import("@/app/privacy/page")).default;

    render(await PrivacyPage());

    expect(JSON.parse(screen.getByTestId("privacy-page").textContent ?? "{}")).toEqual({ isAuthenticated: true });
  });

  it("does not redirect anyone — this page is reachable while logged out", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const PrivacyPage = (await import("@/app/privacy/page")).default;

    expect(await PrivacyPage()).toBeTruthy();
  });
});

describe("/terms — server-side auth awareness", () => {
  it("passes isAuthenticated: false for a logged-out visitor", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const TermsPage = (await import("@/app/terms/page")).default;

    render(await TermsPage());

    expect(JSON.parse(screen.getByTestId("terms-page").textContent ?? "{}")).toEqual({ isAuthenticated: false });
  });

  it("passes isAuthenticated: true for a signed-in visitor", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1", email: "jamie@example.com" } } });
    const TermsPage = (await import("@/app/terms/page")).default;

    render(await TermsPage());

    expect(JSON.parse(screen.getByTestId("terms-page").textContent ?? "{}")).toEqual({ isAuthenticated: true });
  });

  it("does not redirect anyone — this page is reachable while logged out", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const TermsPage = (await import("@/app/terms/page")).default;

    expect(await TermsPage()).toBeTruthy();
  });
});

describe("BackNavigationLink", () => {
  it("points signed-in visitors to the dashboard and logged-out visitors home", async () => {
    const { BackNavigationLink } = await import("@/components/legal/BackNavigationLink");

    const { rerender } = render(<BackNavigationLink isAuthenticated />);
    expect(screen.getByRole("link", { name: /back to dashboard/i })).toHaveAttribute("href", "/dashboard");

    rerender(<BackNavigationLink isAuthenticated={false} />);
    expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
  });
});
