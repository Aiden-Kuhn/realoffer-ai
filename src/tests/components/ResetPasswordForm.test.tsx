// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

const pushMock = vi.fn();
const updatePasswordMock = vi.fn();
let searchParamsValue = new URLSearchParams();
let authState: { user: { email: string } | null; isLoading: boolean } = { user: { email: "jamie@example.com" }, isLoading: false };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => searchParamsValue,
}));
vi.mock("@/lib/auth/AuthProvider", () => ({
  useAuth: () => ({ ...authState, updatePassword: updatePasswordMock }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
  searchParamsValue = new URLSearchParams();
  authState = { user: { email: "jamie@example.com" }, isLoading: false };
});

describe("ResetPasswordForm — session verification", () => {
  it("shows a verifying state while the session is still loading", () => {
    authState = { user: null, isLoading: true };
    render(<ResetPasswordForm />);
    expect(screen.getByText("Verifying your link…")).toBeInTheDocument();
  });

  it("shows an invalid-link error state with no session and no error param", () => {
    authState = { user: null, isLoading: false };
    render(<ResetPasswordForm />);
    expect(screen.getByText("No active reset session")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Request a new link" })).toHaveAttribute("href", "/forgot-password");
  });

  it("shows an expired/invalid-link message for Supabase's own hosted-verify error redirect shape (expired/reused link)", () => {
    authState = { user: null, isLoading: false };
    // This is the exact query string Supabase's hosted recovery-link
    // verification appends to redirectTo for an expired or already-used
    // link — there's no custom route in this flow to normalize it into a
    // different shape, so ResetPasswordForm must recognize it directly.
    searchParamsValue = new URLSearchParams({
      error: "access_denied",
      error_code: "otp_expired",
      error_description: "Email link is invalid or has expired",
    });
    render(<ResetPasswordForm />);
    expect(screen.getByText("This link is invalid or has expired")).toBeInTheDocument();
  });

  it("also recognizes any other Supabase error redirect (not just otp_expired) as an invalid link", () => {
    authState = { user: null, isLoading: false };
    searchParamsValue = new URLSearchParams({ error: "server_error" });
    render(<ResetPasswordForm />);
    expect(screen.getByText("This link is invalid or has expired")).toBeInTheDocument();
  });

  it("shows the password form once a valid session is present", () => {
    render(<ResetPasswordForm />);
    expect(screen.getByRole("button", { name: "Update password" })).toBeInTheDocument();
  });
});

describe("ResetPasswordForm — validation", () => {
  it("requires at least 8 characters", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("New password", { exact: false }), "short1");
    await user.type(screen.getByLabelText("Confirm password", { exact: false }), "short1");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByText("Password must be at least 8 characters.")).toBeInTheDocument();
    expect(updatePasswordMock).not.toHaveBeenCalled();
  });

  it("requires the two passwords to match", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("New password", { exact: false }), "correcthorse1");
    await user.type(screen.getByLabelText("Confirm password", { exact: false }), "differenthorse1");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByText("Passwords don't match.")).toBeInTheDocument();
    expect(updatePasswordMock).not.toHaveBeenCalled();
  });
});

describe("ResetPasswordForm — password visibility toggle", () => {
  it("toggles the new-password field between hidden and visible text", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    const input = screen.getByLabelText("New password", { exact: false });
    expect(input).toHaveAttribute("type", "password");

    // Both password fields render an independent toggle with the same
    // label — the new-password field's is first in document order.
    await user.click(screen.getAllByRole("button", { name: "Show password" })[0]);
    expect(input).toHaveAttribute("type", "text");

    await user.click(screen.getAllByRole("button", { name: "Hide password" })[0]);
    expect(input).toHaveAttribute("type", "password");
  });
});

describe("ResetPasswordForm — submission", () => {
  it("disables the submit button while the request is in flight", async () => {
    let resolveRequest: (value: { error: string | null }) => void = () => {};
    updatePasswordMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("New password", { exact: false }), "correcthorse1");
    await user.type(screen.getByLabelText("Confirm password", { exact: false }), "correcthorse1");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(screen.getByRole("button", { name: "Updating…" })).toBeDisabled();
    resolveRequest({ error: null });
    await waitFor(() => expect(screen.getByText("Password updated successfully.")).toBeInTheDocument());
  });

  it("shows a friendly error and stays on the form when Supabase rejects the password", async () => {
    updatePasswordMock.mockResolvedValue({ error: "Password should be at least 8 characters." });
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("New password", { exact: false }), "correcthorse1");
    await user.type(screen.getByLabelText("Confirm password", { exact: false }), "correcthorse1");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByText("Password should be at least 8 characters.")).toBeInTheDocument();
    expect(screen.queryByText("Password updated successfully.")).not.toBeInTheDocument();
  });

  it("on success, shows the confirmation message and then redirects to /dashboard for an authenticated user", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    updatePasswordMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("New password", { exact: false }), "correcthorse1");
    await user.type(screen.getByLabelText("Confirm password", { exact: false }), "correcthorse1");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByText("Password updated successfully.")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2100);
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
  });
});
