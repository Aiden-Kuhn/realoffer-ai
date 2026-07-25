// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/auth/LoginForm";

const pushMock = vi.fn();
const signInMock = vi.fn();
let searchParamsValue = new URLSearchParams();
// Mutable reactive auth state, standing in for AuthProvider's own
// user/isLoading — mutated mid-test + rerendered to simulate a session
// becoming visible after the component already mounted.
let mockUser: { id: string; email: string } | null = null;
let mockAuthLoading = false;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => searchParamsValue,
}));
vi.mock("@/lib/auth/AuthProvider", () => ({
  useAuth: () => ({ signIn: signInMock, user: mockUser, isLoading: mockAuthLoading }),
}));

describe("LoginForm — forgot password link", () => {
  it("links to /forgot-password underneath the password field", () => {
    render(<LoginForm />);
    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "/forgot-password");
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  searchParamsValue = new URLSearchParams();
  mockUser = null;
  mockAuthLoading = false;
});

async function fillAndSubmit() {
  const user = userEvent.setup();
  render(<LoginForm />);
  await user.type(screen.getByLabelText("Email", { exact: false }), "jamie@example.com");
  await user.type(screen.getByLabelText("Password", { exact: false }), "correct horse battery staple");
  await user.click(screen.getByRole("button", { name: "Log in" }));
  return user;
}

describe("LoginForm — post-login redirect", () => {
  it("goes to /dashboard by default when there is no redirectTo", async () => {
    signInMock.mockResolvedValue({ error: null });
    await fillAndSubmit();
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
  });

  it("goes to a valid redirectTo target (e.g. the focused analysis route)", async () => {
    signInMock.mockResolvedValue({ error: null });
    searchParamsValue = new URLSearchParams({ redirectTo: "/analyze" });
    await fillAndSubmit();
    expect(pushMock).toHaveBeenCalledWith("/analyze");
  });

  it("falls back to /dashboard for an unsafe redirectTo (open-redirect attempt)", async () => {
    signInMock.mockResolvedValue({ error: null });
    searchParamsValue = new URLSearchParams({ redirectTo: "https://evil.example.com" });
    await fillAndSubmit();
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
  });

  it("does not navigate at all when sign-in fails", async () => {
    signInMock.mockResolvedValue({ error: "Incorrect email or password." });
    await fillAndSubmit();
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByText("Incorrect email or password.")).toBeInTheDocument();
  });
});

describe("LoginForm — defensive redirect for an already-authenticated visitor", () => {
  // app/login/page.tsx's server-side guard is the primary defense; this is
  // the client-side fallback for a session that becomes visible slightly
  // after that server check already ran (e.g. arriving here moments after
  // an /auth/confirm email-verification redirect) — this is exactly the
  // reported bug: verification succeeds, but the user still sees a login
  // step instead of being let straight through.
  it("does nothing while a session is still loading — a loading auth state is not the same as unauthenticated", () => {
    const fakeLocation = { ...window.location, href: "" };
    vi.stubGlobal("location", fakeLocation);
    mockUser = null;
    mockAuthLoading = true;

    render(<LoginForm />);

    expect(fakeLocation.href).toBe("");
  });

  it("redirects immediately to the dashboard once an authenticated user is detected, without requiring a Login click", async () => {
    const fakeLocation = { ...window.location, href: "" };
    vi.stubGlobal("location", fakeLocation);
    mockUser = { id: "user-1", email: "jamie@example.com" };
    mockAuthLoading = false;

    render(<LoginForm />);

    await vi.waitFor(() => expect(fakeLocation.href).toBe("/dashboard"));
  });

  it("honors a safe redirectTo target when redirecting an already-authenticated visitor", async () => {
    const fakeLocation = { ...window.location, href: "" };
    vi.stubGlobal("location", fakeLocation);
    searchParamsValue = new URLSearchParams({ redirectTo: "/analyze" });
    mockUser = { id: "user-1", email: "jamie@example.com" };
    mockAuthLoading = false;

    render(<LoginForm />);

    await vi.waitFor(() => expect(fakeLocation.href).toBe("/analyze"));
  });
});
