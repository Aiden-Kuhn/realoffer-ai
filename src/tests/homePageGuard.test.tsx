import { afterEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: getUserMock } })),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("/ (marketing home page) — returning-visitor guard", () => {
  it("redirects a signed-in visitor to /dashboard instead of showing the marketing page again", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { redirect } = await import("next/navigation");
    const Home = (await import("@/app/page")).default;

    await Home();

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("does not redirect a logged-out visitor — the marketing page still renders", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { redirect } = await import("next/navigation");
    const Home = (await import("@/app/page")).default;

    const result = await Home();

    expect(redirect).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });
});
