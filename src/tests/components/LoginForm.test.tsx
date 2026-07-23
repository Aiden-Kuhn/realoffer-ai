// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/auth/LoginForm";

const pushMock = vi.fn();
const signInMock = vi.fn();
let searchParamsValue = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => searchParamsValue,
}));
vi.mock("@/lib/auth/AuthProvider", () => ({
  useAuth: () => ({ signIn: signInMock }),
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
  searchParamsValue = new URLSearchParams();
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
