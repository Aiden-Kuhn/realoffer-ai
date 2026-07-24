import { afterEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: getUserMock } })),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
// DashboardShell pulls in client-only hooks/nav not relevant here — stubbed
// so this test only exercises the server-side auth guard.
vi.mock("@/components/dashboard/DashboardShell", () => ({ DashboardShell: ({ children }: { children: React.ReactNode }) => children }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("/dashboard (and everything nested under it, e.g. /dashboard/settings) — auth guard", () => {
  it("redirects to /login before rendering anything when there is no session", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { redirect } = await import("next/navigation");
    const DashboardLayout = (await import("@/app/dashboard/layout")).default;

    await DashboardLayout({ children: null });

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("does not redirect and renders the shell when a session exists", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { redirect } = await import("next/navigation");
    const DashboardLayout = (await import("@/app/dashboard/layout")).default;

    const result = await DashboardLayout({ children: null });

    expect(redirect).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });
});
