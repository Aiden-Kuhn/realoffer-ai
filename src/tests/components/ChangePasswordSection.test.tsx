// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChangePasswordSection } from "@/components/dashboard/ChangePasswordSection";

const changePasswordMock = vi.fn();

vi.mock("@/lib/auth/AuthProvider", () => ({
  useAuth: () => ({ changePassword: changePasswordMock }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// "New password" is a substring of "Confirm new password", so plain
// exact:false matching against "New password" ambiguously hits both labels
// — anchor to the start of the label text to disambiguate.
function currentPasswordInput() {
  return screen.getByLabelText(/^Current password/);
}
function newPasswordInput() {
  return screen.getByLabelText(/^New password/);
}
function confirmNewPasswordInput() {
  return screen.getByLabelText(/^Confirm new password/);
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>, overrides: { current?: string; next?: string; confirm?: string } = {}) {
  render(<ChangePasswordSection />);
  await user.type(currentPasswordInput(), overrides.current ?? "myCurrentPassword1");
  await user.type(newPasswordInput(), overrides.next ?? "aBrandNewPassword1");
  await user.type(confirmNewPasswordInput(), overrides.confirm ?? "aBrandNewPassword1");
  await user.click(screen.getByRole("button", { name: "Update password" }));
}

describe("ChangePasswordSection — validation", () => {
  it("requires a current password", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordSection />);
    await user.type(newPasswordInput(), "aBrandNewPassword1");
    await user.type(confirmNewPasswordInput(), "aBrandNewPassword1");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByText("Enter your current password.")).toBeInTheDocument();
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it("requires the new password to be at least 8 characters", async () => {
    const user = userEvent.setup();
    await fillAndSubmit(user, { next: "short1", confirm: "short1" });

    expect(await screen.findByText("Password must be at least 8 characters.")).toBeInTheDocument();
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it("requires the new password and confirmation to match", async () => {
    const user = userEvent.setup();
    await fillAndSubmit(user, { next: "aBrandNewPassword1", confirm: "aDifferentPassword1" });

    expect(await screen.findByText("Passwords don't match.")).toBeInTheDocument();
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it("rejects a new password identical to the current password", async () => {
    const user = userEvent.setup();
    await fillAndSubmit(user, { current: "sameOldPassword1", next: "sameOldPassword1", confirm: "sameOldPassword1" });

    expect(await screen.findByText("New password must be different from your current password.")).toBeInTheDocument();
    expect(changePasswordMock).not.toHaveBeenCalled();
  });
});

describe("ChangePasswordSection — submission", () => {
  it("shows a friendly error and never signs the user out when the current password is wrong", async () => {
    changePasswordMock.mockResolvedValue({ error: "Current password is incorrect." });
    const user = userEvent.setup();
    await fillAndSubmit(user);

    expect(await screen.findByText("Current password is incorrect.")).toBeInTheDocument();
    expect(screen.queryByText(/Password updated successfully/)).not.toBeInTheDocument();
  });

  it("disables the submit button while the request is in flight", async () => {
    let resolveRequest: (value: { error: string | null }) => void = () => {};
    changePasswordMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const user = userEvent.setup();
    await fillAndSubmit(user);

    expect(screen.getByRole("button", { name: "Updating…" })).toBeDisabled();
    resolveRequest({ error: null });
    await waitFor(() => expect(screen.getByText(/Password updated successfully/)).toBeInTheDocument());
  });

  it("passes only the current and new password to changePassword — no email or user id", async () => {
    changePasswordMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    await fillAndSubmit(user, { current: "myCurrentPassword1", next: "aBrandNewPassword1", confirm: "aBrandNewPassword1" });

    expect(changePasswordMock).toHaveBeenCalledWith("myCurrentPassword1", "aBrandNewPassword1");
    expect(changePasswordMock).toHaveBeenCalledTimes(1);
  });

  it("on success, shows confirmation then forces a full navigation to /login (signing out everywhere)", async () => {
    const fakeLocation = { ...window.location, href: "" };
    vi.stubGlobal("location", fakeLocation);

    vi.useFakeTimers({ shouldAdvanceTime: true });
    changePasswordMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    await fillAndSubmit(user);

    expect(await screen.findByText(/Password updated successfully/)).toBeInTheDocument();
    expect(fakeLocation.href).toBe("");

    await vi.advanceTimersByTimeAsync(2100);
    expect(fakeLocation.href).toBe("/login");
  });
});
