import { afterEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: getUserMock } })),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("/getting-started layout — auth guard", () => {
  it("redirects to /login with a redirectTo back to /getting-started when there is no session", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { redirect } = await import("next/navigation");
    const GettingStartedLayout = (await import("@/app/getting-started/layout")).default;

    await GettingStartedLayout({ children: null });

    expect(redirect).toHaveBeenCalledWith("/login?redirectTo=%2Fgetting-started");
  });

  it("does not redirect and renders children when a session exists", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { redirect } = await import("next/navigation");
    const GettingStartedLayout = (await import("@/app/getting-started/layout")).default;

    const result = await GettingStartedLayout({ children: "getting-started-content" });

    expect(redirect).not.toHaveBeenCalled();
    expect(result.props.children).toBe("getting-started-content");
  });
});
