// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/lib/auth/AuthProvider";

const resetPasswordForEmailMock = vi.fn();
const updateUserMock = vi.fn();
const getSessionMock = vi.fn().mockResolvedValue({ data: { session: null } });
const onAuthStateChangeMock = vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeMock,
      resetPasswordForEmail: resetPasswordForEmailMock,
      updateUser: updateUserMock,
    },
  }),
}));

afterEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue({ data: { session: null } });
});

function renderAuth() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider });
}

describe("AuthProvider — sendPasswordResetEmail", () => {
  it("calls Supabase's resetPasswordForEmail with a trimmed email and a redirectTo pointing at /reset-password", async () => {
    resetPasswordForEmailMock.mockResolvedValue({ error: null });
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const response = await result.current.sendPasswordResetEmail("  jamie@example.com  ");

    expect(response.error).toBeNull();
    expect(resetPasswordForEmailMock).toHaveBeenCalledWith("jamie@example.com", {
      redirectTo: expect.stringContaining("/reset-password"),
    });
  });

  it("surfaces a genuine failure (e.g. rate limiting) as a friendly error, not a silent success", async () => {
    resetPasswordForEmailMock.mockResolvedValue({ error: { message: "Email rate limit exceeded" } });
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const response = await result.current.sendPasswordResetEmail("jamie@example.com");

    expect(response.error).toBe("Email rate limit exceeded");
  });
});

describe("AuthProvider — updatePassword", () => {
  it("calls Supabase's updateUser with the new password", async () => {
    updateUserMock.mockResolvedValue({ error: null });
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const response = await result.current.updatePassword("a-new-strong-password");

    expect(response.error).toBeNull();
    expect(updateUserMock).toHaveBeenCalledWith({ password: "a-new-strong-password" });
  });

  it("surfaces a weak-password rejection from Supabase as an error", async () => {
    updateUserMock.mockResolvedValue({ error: { message: "Password should be at least 8 characters" } });
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const response = await result.current.updatePassword("short");

    expect(response.error).toBe("Password should be at least 8 characters");
  });
});
