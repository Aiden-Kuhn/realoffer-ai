// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthConfirmClient } from "@/components/auth/AuthConfirmClient";

const confirmEmailMock = vi.fn();
const resendVerificationEmailMock = vi.fn();
let searchParamsValue = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsValue,
}));
vi.mock("@/lib/auth/AuthProvider", () => ({
  useAuth: () => ({ confirmEmail: confirmEmailMock, resendVerificationEmail: resendVerificationEmailMock }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  searchParamsValue = new URLSearchParams();
});

function stubLocation() {
  const fakeLocation = { ...window.location, href: "" };
  vi.stubGlobal("location", fakeLocation);
  return fakeLocation;
}

describe("AuthConfirmClient — verifying state", () => {
  it("shows a loading message immediately, before the exchange resolves", () => {
    searchParamsValue = new URLSearchParams({ code: "the-pkce-code" });
    confirmEmailMock.mockReturnValue(new Promise(() => {})); // never resolves
    render(<AuthConfirmClient />);

    expect(screen.getByText("Verifying your email and signing you in…")).toBeInTheDocument();
  });
});

describe("AuthConfirmClient — token_hash + type callback (what GoTrue's hosted /verify redirect, i.e. the default unedited 'Confirm signup' template, actually produces)", () => {
  it("verifies via token_hash + type and hard-navigates straight into the dashboard, with no login step", async () => {
    const fakeLocation = stubLocation();
    searchParamsValue = new URLSearchParams({ token_hash: "the-token-hash", type: "signup" });
    confirmEmailMock.mockResolvedValue({ error: null });

    render(<AuthConfirmClient />);

    await waitFor(() => expect(fakeLocation.href).toBe("/dashboard"));
    expect(confirmEmailMock).toHaveBeenCalledWith({ tokenHash: "the-token-hash", type: "signup" });
    expect(confirmEmailMock).toHaveBeenCalledTimes(1);
  });

  it("a fresh, genuinely valid link must NOT be treated as invalid just because it has no `code` param", async () => {
    stubLocation();
    // This is the exact bug report: a brand-new link with token_hash+type
    // (no code at all) was wrongly shown as expired because the old code
    // only ever looked for `code`.
    searchParamsValue = new URLSearchParams({ token_hash: "a-fresh-token", type: "signup" });
    confirmEmailMock.mockResolvedValue({ error: null });

    render(<AuthConfirmClient />);

    await waitFor(() => expect(confirmEmailMock).toHaveBeenCalled());
    expect(screen.queryByText("This verification link is invalid or has expired")).not.toBeInTheDocument();
  });

  it("token_hash + type takes priority when both it and a code param happen to be present", async () => {
    stubLocation();
    searchParamsValue = new URLSearchParams({ token_hash: "the-token-hash", type: "signup", code: "some-other-code" });
    confirmEmailMock.mockResolvedValue({ error: null });

    render(<AuthConfirmClient />);

    await waitFor(() => expect(confirmEmailMock).toHaveBeenCalled());
    expect(confirmEmailMock).toHaveBeenCalledWith({ tokenHash: "the-token-hash", type: "signup" });
  });

  it("shows the invalid/expired error state for a genuinely expired token, and never navigates", async () => {
    const fakeLocation = stubLocation();
    searchParamsValue = new URLSearchParams({ token_hash: "an-expired-token", type: "signup" });
    confirmEmailMock.mockResolvedValue({ error: "Token has expired or is invalid" });

    render(<AuthConfirmClient />);

    expect(await screen.findByText("This verification link is invalid or has expired")).toBeInTheDocument();
    expect(fakeLocation.href).toBe("");
  });

  it("shows the same error state for a reused (already-verified) token", async () => {
    searchParamsValue = new URLSearchParams({ token_hash: "an-already-used-token", type: "signup" });
    confirmEmailMock.mockResolvedValue({ error: "Token has expired or is invalid" });

    render(<AuthConfirmClient />);

    expect(await screen.findByText("This verification link is invalid or has expired")).toBeInTheDocument();
    expect(screen.getByText(/already verified your email, just log in/)).toBeInTheDocument();
  });
});

describe("AuthConfirmClient — PKCE code callback", () => {
  it("exchanges the code exactly once and hard-navigates straight into the dashboard, with no login step", async () => {
    const fakeLocation = stubLocation();
    searchParamsValue = new URLSearchParams({ code: "the-pkce-code" });
    confirmEmailMock.mockResolvedValue({ error: null });

    render(<AuthConfirmClient />);

    await waitFor(() => expect(fakeLocation.href).toBe("/dashboard"));
    expect(confirmEmailMock).toHaveBeenCalledWith({ code: "the-pkce-code" });
    expect(confirmEmailMock).toHaveBeenCalledTimes(1);
  });

  it("shows the invalid/expired error state and never navigates", async () => {
    const fakeLocation = stubLocation();
    searchParamsValue = new URLSearchParams({ code: "an-expired-code" });
    confirmEmailMock.mockResolvedValue({ error: "Email link is invalid or has expired" });

    render(<AuthConfirmClient />);

    expect(await screen.findByText("This verification link is invalid or has expired")).toBeInTheDocument();
    expect(fakeLocation.href).toBe("");
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
    confirmEmailMock.mockResolvedValue({ error: "expired" });
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
