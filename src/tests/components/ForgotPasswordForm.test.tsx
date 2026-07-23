// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

const sendPasswordResetEmailMock = vi.fn();

vi.mock("@/lib/auth/AuthProvider", () => ({
  useAuth: () => ({ sendPasswordResetEmail: sendPasswordResetEmailMock }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ForgotPasswordForm — validation", () => {
  it("rejects an empty submission without calling Supabase", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();
  });

  it("rejects a malformed email", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email", { exact: false }), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();
  });
});

describe("ForgotPasswordForm — submission", () => {
  it("shows a loading state while the request is in flight", async () => {
    let resolveRequest: (value: { error: string | null }) => void = () => {};
    sendPasswordResetEmailMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email", { exact: false }), "jamie@example.com");
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
    resolveRequest({ error: null });
    await waitFor(() => expect(screen.getByText("Check your email")).toBeInTheDocument());
  });

  it("always shows the same non-enumerating success message on success, regardless of whether the account exists", async () => {
    sendPasswordResetEmailMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email", { exact: false }), "jamie@example.com");
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    expect(await screen.findByText("If an account exists with that email, we've sent a password reset link.")).toBeInTheDocument();
  });

  it("shows a friendly error and stays on the form for a genuine failure (e.g. network error)", async () => {
    sendPasswordResetEmailMock.mockResolvedValue({ error: "Network error — please try again." });
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email", { exact: false }), "jamie@example.com");
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    expect(await screen.findByText("Network error — please try again.")).toBeInTheDocument();
    expect(screen.queryByText("Check your email")).not.toBeInTheDocument();
  });
});
