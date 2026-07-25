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

describe("AuthConfirmClient — verifying state", () => {
  it("shows a loading message immediately, before the exchange resolves", () => {
    searchParamsValue = new URLSearchParams({ code: "the-pkce-code" });
    confirmEmailMock.mockReturnValue(new Promise(() => {})); // never resolves
    render(<AuthConfirmClient />);

    expect(screen.getByText("Verifying your email and signing you in…")).toBeInTheDocument();
  });
});

describe("AuthConfirmClient — new user, successful verification", () => {
  it("exchanges the code exactly once and hard-navigates straight into the dashboard, with no login step", async () => {
    const fakeLocation = { ...window.location, href: "" };
    vi.stubGlobal("location", fakeLocation);
    searchParamsValue = new URLSearchParams({ code: "the-pkce-code" });
    confirmEmailMock.mockResolvedValue({ error: null });

    render(<AuthConfirmClient />);

    await waitFor(() => expect(fakeLocation.href).toBe("/dashboard"));
    expect(confirmEmailMock).toHaveBeenCalledWith("the-pkce-code");
    expect(confirmEmailMock).toHaveBeenCalledTimes(1);
  });
});

describe("AuthConfirmClient — expired link", () => {
  it("shows the invalid/expired error state and never navigates", async () => {
    const fakeLocation = { ...window.location, href: "" };
    vi.stubGlobal("location", fakeLocation);
    searchParamsValue = new URLSearchParams({ code: "an-expired-code" });
    confirmEmailMock.mockResolvedValue({ error: "Email link is invalid or has expired" });

    render(<AuthConfirmClient />);

    expect(await screen.findByText("This verification link is invalid or has expired")).toBeInTheDocument();
    expect(fakeLocation.href).toBe("");
  });
});

describe("AuthConfirmClient — invalid link (no code at all)", () => {
  it("shows the error state immediately without ever calling confirmEmail", async () => {
    searchParamsValue = new URLSearchParams(); // no ?code=
    render(<AuthConfirmClient />);

    expect(await screen.findByText("This verification link is invalid or has expired")).toBeInTheDocument();
    expect(confirmEmailMock).not.toHaveBeenCalled();
  });
});

describe("AuthConfirmClient — already-verified user reusing the link", () => {
  it("a second click on the same (now single-use, consumed) link shows the same error state, with a hint to just log in", async () => {
    searchParamsValue = new URLSearchParams({ code: "an-already-used-code" });
    confirmEmailMock.mockResolvedValue({ error: "invalid flow state, no valid flow state found" });

    render(<AuthConfirmClient />);

    expect(await screen.findByText("This verification link is invalid or has expired")).toBeInTheDocument();
    expect(screen.getByText(/already verified your email, just log in/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to login" })).toHaveAttribute("href", "/login");
  });
});

describe("AuthConfirmClient — resend verification email", () => {
  async function renderErrorState() {
    searchParamsValue = new URLSearchParams({ code: "an-expired-code" });
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
