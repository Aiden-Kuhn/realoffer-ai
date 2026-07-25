// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthConfirmClient } from "@/components/auth/AuthConfirmClient";

const confirmEmailMock = vi.fn();
const resendVerificationEmailMock = vi.fn();
let searchParamsValue = new URLSearchParams();
// Mutable "reactive" user, standing in for AuthProvider's own state, which
// in the real app updates via its onAuthStateChange subscription
// independently of (and not necessarily synchronized with) confirmEmail's
// own promise resolving — exactly the gap that caused the false timeout.
let mockUser: { id: string; email: string } | null = null;

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsValue,
}));
vi.mock("@/lib/auth/AuthProvider", () => ({
  useAuth: () => ({ user: mockUser, confirmEmail: confirmEmailMock, resendVerificationEmail: resendVerificationEmailMock }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  searchParamsValue = new URLSearchParams();
  mockUser = null;
});

function stubLocation() {
  const fakeLocation = { ...window.location, href: "" };
  vi.stubGlobal("location", fakeLocation);
  return fakeLocation;
}

function signInUser() {
  mockUser = { id: "user-1", email: "jamie@example.com" };
}

describe("AuthConfirmClient — verifying state", () => {
  it("shows a loading message immediately, before anything resolves", () => {
    searchParamsValue = new URLSearchParams({ code: "the-pkce-code" });
    confirmEmailMock.mockReturnValue(new Promise(() => {})); // never resolves
    render(<AuthConfirmClient />);

    expect(screen.getByText("Verifying your email and signing you in…")).toBeInTheDocument();
  });

  it("never shows the invalid/expired message just because the session is null on the very first render", () => {
    searchParamsValue = new URLSearchParams({ token_hash: "a-token", type: "signup" });
    confirmEmailMock.mockReturnValue(new Promise(() => {}));
    render(<AuthConfirmClient />);

    expect(screen.queryByText("This verification link is invalid or has expired")).not.toBeInTheDocument();
  });
});

describe("AuthConfirmClient — the exact reported race: verification succeeds server-side, but the session takes a moment to become visible here", () => {
  it("navigates to the dashboard once `user` appears, even though confirmEmail() itself reported a (non-expiration) error", async () => {
    const fakeLocation = stubLocation();
    searchParamsValue = new URLSearchParams({ token_hash: "the-token-hash", type: "signup" });
    // This is the reported live behavior: GoTrue's hosted /verify already
    // confirmed the email and established a session, but this component's
    // own verifyOtp call reports an error anyway (e.g. the token was
    // already partially consumed by that hosted redirect).
    confirmEmailMock.mockResolvedValue({ error: "invalid flow state, no valid flow state found" });

    const { rerender } = render(<AuthConfirmClient />);
    await waitFor(() => expect(confirmEmailMock).toHaveBeenCalled());

    // Must NOT show the timeout/invalid message just because this one
    // call errored — the reactive session is still the source of truth.
    expect(screen.queryByText("This verification link is invalid or has expired")).not.toBeInTheDocument();
    expect(fakeLocation.href).toBe("");

    // A moment later, AuthProvider's own onAuthStateChange listener catches
    // up (SIGNED_IN / INITIAL_SESSION) and `user` becomes available.
    signInUser();
    rerender(<AuthConfirmClient />);

    await waitFor(() => expect(fakeLocation.href).toBe("/dashboard"));
    expect(screen.queryByText("This verification link is invalid or has expired")).not.toBeInTheDocument();
  });

  it("navigates once `user` appears even when confirmEmail() is still pending (session hydration delayed)", async () => {
    const fakeLocation = stubLocation();
    searchParamsValue = new URLSearchParams({ code: "the-pkce-code" });
    confirmEmailMock.mockReturnValue(new Promise(() => {})); // simulate a slow/never-settling call

    const { rerender } = render(<AuthConfirmClient />);
    await waitFor(() => expect(confirmEmailMock).toHaveBeenCalled());

    signInUser();
    rerender(<AuthConfirmClient />);

    await waitFor(() => expect(fakeLocation.href).toBe("/dashboard"));
  });
});

describe("AuthConfirmClient — token_hash + type callback (what GoTrue's hosted /verify redirect, i.e. the default unedited 'Confirm signup' template, actually produces)", () => {
  it("verifies via token_hash + type, and once the session appears, hard-navigates straight into the dashboard with no login step", async () => {
    const fakeLocation = stubLocation();
    searchParamsValue = new URLSearchParams({ token_hash: "the-token-hash", type: "signup" });
    confirmEmailMock.mockImplementation(async () => {
      signInUser();
      return { error: null };
    });

    const { rerender } = render(<AuthConfirmClient />);
    await waitFor(() => expect(confirmEmailMock).toHaveBeenCalledWith({ tokenHash: "the-token-hash", type: "signup" }));
    rerender(<AuthConfirmClient />);

    await waitFor(() => expect(fakeLocation.href).toBe("/dashboard"));
    expect(confirmEmailMock).toHaveBeenCalledTimes(1);
  });

  it("token_hash + type takes priority when both it and a code param happen to be present", async () => {
    searchParamsValue = new URLSearchParams({ token_hash: "the-token-hash", type: "signup", code: "some-other-code" });
    confirmEmailMock.mockResolvedValue({ error: null });

    render(<AuthConfirmClient />);

    await waitFor(() => expect(confirmEmailMock).toHaveBeenCalled());
    expect(confirmEmailMock).toHaveBeenCalledWith({ tokenHash: "the-token-hash", type: "signup" });
  });

  it("shows the invalid/expired error state immediately for a genuinely expired token, without waiting out the bounded window", async () => {
    const fakeLocation = stubLocation();
    searchParamsValue = new URLSearchParams({ token_hash: "an-expired-token", type: "signup" });
    confirmEmailMock.mockResolvedValue({ error: "Token has expired or is invalid" });

    render(<AuthConfirmClient />);

    expect(await screen.findByText("This verification link is invalid or has expired")).toBeInTheDocument();
    expect(fakeLocation.href).toBe("");
  });

  it("shows the same error state for a reused (already-verified) token whose session never appears", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    searchParamsValue = new URLSearchParams({ token_hash: "an-already-used-token", type: "signup" });
    confirmEmailMock.mockResolvedValue({ error: "invalid flow state, no valid flow state found" });

    render(<AuthConfirmClient />);
    await vi.waitFor(() => expect(confirmEmailMock).toHaveBeenCalled());

    // Not shown right away — a non-expiration error alone isn't proof of
    // failure, so the bounded wait runs its course first.
    expect(screen.queryByText("This verification link is invalid or has expired")).not.toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(6100);

    expect(screen.getByText("This verification link is invalid or has expired")).toBeInTheDocument();
    expect(screen.getByText(/already verified your email, just log in/)).toBeInTheDocument();
  });
});

describe("AuthConfirmClient — PKCE code callback", () => {
  it("exchanges the code exactly once, and once the session appears, hard-navigates straight into the dashboard", async () => {
    const fakeLocation = stubLocation();
    searchParamsValue = new URLSearchParams({ code: "the-pkce-code" });
    confirmEmailMock.mockImplementation(async () => {
      signInUser();
      return { error: null };
    });

    const { rerender } = render(<AuthConfirmClient />);
    await waitFor(() => expect(confirmEmailMock).toHaveBeenCalledWith({ code: "the-pkce-code" }));
    rerender(<AuthConfirmClient />);

    await waitFor(() => expect(fakeLocation.href).toBe("/dashboard"));
    expect(confirmEmailMock).toHaveBeenCalledTimes(1);
  });

  it("shows the invalid/expired error state immediately and never navigates for an expired code", async () => {
    const fakeLocation = stubLocation();
    searchParamsValue = new URLSearchParams({ code: "an-expired-code" });
    confirmEmailMock.mockResolvedValue({ error: "Email link is invalid or has expired" });

    render(<AuthConfirmClient />);

    expect(await screen.findByText("This verification link is invalid or has expired")).toBeInTheDocument();
    expect(fakeLocation.href).toBe("");
  });
});

describe("AuthConfirmClient — bounded wait for a genuinely bad link", () => {
  it("does not show the error message merely because the session hasn't appeared on the first check", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    searchParamsValue = new URLSearchParams({ token_hash: "a-token", type: "signup" });
    confirmEmailMock.mockResolvedValue({ error: null });

    render(<AuthConfirmClient />);
    await vi.waitFor(() => expect(confirmEmailMock).toHaveBeenCalled());

    await vi.advanceTimersByTimeAsync(1000);
    expect(screen.queryByText("This verification link is invalid or has expired")).not.toBeInTheDocument();
  });

  it("concludes failure once the full bounded window elapses with no session ever appearing", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    searchParamsValue = new URLSearchParams({ token_hash: "a-token", type: "signup" });
    confirmEmailMock.mockResolvedValue({ error: null });

    render(<AuthConfirmClient />);
    await vi.waitFor(() => expect(confirmEmailMock).toHaveBeenCalled());
    await vi.advanceTimersByTimeAsync(6100);

    expect(screen.getByText("This verification link is invalid or has expired")).toBeInTheDocument();
  });
});

describe("AuthConfirmClient — missing parameters", () => {
  it("shows the error state immediately without ever calling confirmEmail when neither format is present", async () => {
    searchParamsValue = new URLSearchParams(); // no code, no token_hash/type
    render(<AuthConfirmClient />);

    expect(await screen.findByText("This verification link is invalid or has expired")).toBeInTheDocument();
    expect(confirmEmailMock).not.toHaveBeenCalled();
  });

  it("treats a lone token_hash with no type as missing — falls through to code, then to the error state", async () => {
    searchParamsValue = new URLSearchParams({ token_hash: "the-token-hash" }); // no type
    render(<AuthConfirmClient />);

    expect(await screen.findByText("This verification link is invalid or has expired")).toBeInTheDocument();
    expect(confirmEmailMock).not.toHaveBeenCalled();
  });
});

describe("AuthConfirmClient — resend verification email", () => {
  async function renderErrorState() {
    searchParamsValue = new URLSearchParams({ token_hash: "an-expired-token", type: "signup" });
    confirmEmailMock.mockResolvedValue({ error: "Token has expired or is invalid" });
    render(<AuthConfirmClient />);
    await screen.findByText("This verification link is invalid or has expired");
  }

  it("lets the user resend a fresh verification email", async () => {
    resendVerificationEmailMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    await renderErrorState();

    await user.type(screen.getByLabelText("Email", { exact: false }), "jamie@example.com");
    await user.click(screen.getByRole("button", { name: "Resend verification email" }));

    expect(resendVerificationEmailMock).toHaveBeenCalledWith("jamie@example.com");
    expect(await screen.findByText("Verification email sent — check your inbox.")).toBeInTheDocument();
  });

  it("shows a friendly error if resending fails", async () => {
    resendVerificationEmailMock.mockResolvedValue({ error: "Email rate limit exceeded" });
    const user = userEvent.setup();
    await renderErrorState();

    await user.type(screen.getByLabelText("Email", { exact: false }), "jamie@example.com");
    await user.click(screen.getByRole("button", { name: "Resend verification email" }));

    expect(await screen.findByText("Email rate limit exceeded")).toBeInTheDocument();
  });
});
