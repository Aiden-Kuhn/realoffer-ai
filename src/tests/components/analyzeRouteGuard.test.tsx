import { afterEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: getUserMock } })),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("/analyze layout — auth guard", () => {
  it("redirects to /login with a redirectTo back to /analyze when there is no session", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { redirect } = await import("next/navigation");
    const AnalyzeLayout = (await import("@/app/analyze/layout")).default;

    await AnalyzeLayout({ children: null });

    expect(redirect).toHaveBeenCalledWith("/login?redirectTo=%2Fanalyze");
  });

  it("does not redirect and renders children when a session exists", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { redirect } = await import("next/navigation");
    const AnalyzeLayout = (await import("@/app/analyze/layout")).default;

    const result = await AnalyzeLayout({ children: "focused-analysis-content" });

    expect(redirect).not.toHaveBeenCalled();
    expect(result.props.children).toBe("focused-analysis-content");
  });
});
