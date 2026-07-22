import { afterEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: getUserMock } })),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
// These pages render forms with react-hook-form/zod wiring that isn't
// relevant here — stubbed so this test only exercises the server-side
// already-authenticated guard, not the client form itself.
vi.mock("@/components/auth/LoginForm", () => ({ LoginForm: () => null }));
vi.mock("@/components/auth/SignupForm", () => ({ SignupForm: () => null }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("/login and /signup — already-authenticated guard", () => {
  it("LoginPage redirects to /dashboard when a session already exists", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { redirect } = await import("next/navigation");
    const LoginPage = (await import("@/app/login/page")).default;

    await LoginPage();

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("LoginPage does not redirect when there is no session", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { redirect } = await import("next/navigation");
    const LoginPage = (await import("@/app/login/page")).default;

    await LoginPage();

    expect(redirect).not.toHaveBeenCalled();
  });

  it("SignupPage redirects to /dashboard when a session already exists", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { redirect } = await import("next/navigation");
    const SignupPage = (await import("@/app/signup/page")).default;

    await SignupPage();

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("SignupPage does not redirect when there is no session", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { redirect } = await import("next/navigation");
    const SignupPage = (await import("@/app/signup/page")).default;

    await SignupPage();

    expect(redirect).not.toHaveBeenCalled();
  });
});
