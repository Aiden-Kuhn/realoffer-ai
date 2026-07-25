// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/lib/auth/AuthProvider";

const resetPasswordForEmailMock = vi.fn();
const updateUserMock = vi.fn();
const signInWithPasswordMock = vi.fn();
const signOutMock = vi.fn().mockResolvedValue({ error: null });
const signUpMock = vi.fn();
const exchangeCodeForSessionMock = vi.fn();
const verifyOtpMock = vi.fn();
const resendMock = vi.fn();
const getSessionMock = vi.fn().mockResolvedValue({ data: { session: null } });
const onAuthStateChangeMock = vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeMock,
      resetPasswordForEmail: resetPasswordForEmailMock,
      updateUser: updateUserMock,
      signInWithPassword: signInWithPasswordMock,
      signOut: signOutMock,
      signUp: signUpMock,
      exchangeCodeForSession: exchangeCodeForSessionMock,
      verifyOtp: verifyOtpMock,
      resend: resendMock,
    },
  }),
}));

afterEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue({ data: { session: null } });
  signOutMock.mockResolvedValue({ error: null });
});

function renderAuth() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider });
}

/** For changePassword tests, which need `user` populated from the session. */
function renderAuthedAs(email: string) {
  getSessionMock.mockResolvedValue({
    data: { session: { user: { id: "user-1", email, user_metadata: {}, created_at: "2026-01-01T00:00:00.000Z" } } },
  });
  return renderAuth();
}

describe("AuthProvider — sendPasswordResetEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("calls Supabase's resetPasswordForEmail with a trimmed email and the exact allow-listed redirectTo (not window.location.origin)", async () => {
    resetPasswordForEmailMock.mockResolvedValue({ error: null });
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const response = await result.current.sendPasswordResetEmail("  jamie@example.com  ");

    expect(response.error).toBeNull();
    // Must be one of the two URLs actually entered in Supabase's Redirect
    // URLs allow-list — anything else (e.g. a dynamic window.location.origin
    // on a Vercel preview deployment) makes GoTrue silently fall back to the
    // Site URL instead of erroring, which is the exact bug this guards.
    expect(resetPasswordForEmailMock).toHaveBeenCalledWith("jamie@example.com", {
      redirectTo: "http://localhost:3000/reset-password",
    });
  });

  it("uses the production URL when built for production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    resetPasswordForEmailMock.mockResolvedValue({ error: null });
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.sendPasswordResetEmail("jamie@example.com");

    expect(resetPasswordForEmailMock).toHaveBeenCalledWith("jamie@example.com", {
      redirectTo: "https://realoffer-ai.vercel.app/reset-password",
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

describe("AuthProvider — changePassword", () => {
  it("re-verifies the CURRENT password using the session's own email — never a caller-supplied account", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });
    updateUserMock.mockResolvedValue({ error: null });
    const { result } = renderAuthedAs("victim@example.com");
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.changePassword("theirCurrentPassword1", "aBrandNewPassword1");

    // changePassword's signature has no email/user-id parameter at all — the
    // only account it can ever reauthenticate against is whichever one is
    // already signed in, proven here by asserting the exact email used.
    expect(signInWithPasswordMock).toHaveBeenCalledWith({ email: "victim@example.com", password: "theirCurrentPassword1" });
  });

  it("rejects an incorrect current password and never calls updateUser", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: { message: "Invalid login credentials" } });
    const { result } = renderAuthedAs("jamie@example.com");
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const response = await result.current.changePassword("wrongPassword1", "aBrandNewPassword1");

    expect(response.error).toBe("Current password is incorrect.");
    expect(updateUserMock).not.toHaveBeenCalled();
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("updates the password and signs out of every session (scope: global) on success", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });
    updateUserMock.mockResolvedValue({ error: null });
    const { result } = renderAuthedAs("jamie@example.com");
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const response = await result.current.changePassword("correctCurrentPw1", "aBrandNewPassword1");

    expect(response.error).toBeNull();
    expect(updateUserMock).toHaveBeenCalledWith({ password: "aBrandNewPassword1" });
    // Must sign out globally so any other already-open session (another
    // device/browser, a stolen cookie) also stops working with the old
    // credentials once the password changes.
    expect(signOutMock).toHaveBeenCalledWith({ scope: "global" });
  });

  it("does not sign out if updateUser fails after a successful reauthentication", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });
    updateUserMock.mockResolvedValue({ error: { message: "Password should be at least 8 characters" } });
    const { result } = renderAuthedAs("jamie@example.com");
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const response = await result.current.changePassword("correctCurrentPw1", "short");

    expect(response.error).toBe("Password should be at least 8 characters");
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("refuses to run at all when there is no authenticated session", async () => {
    const { result } = renderAuth(); // default mock: session: null
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const response = await result.current.changePassword("anything1", "somethingElse1");

    expect(response.error).toBe("You must be signed in to change your password.");
    expect(signInWithPasswordMock).not.toHaveBeenCalled();
    expect(updateUserMock).not.toHaveBeenCalled();
  });
});

describe("AuthProvider — signUp", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("passes an emailRedirectTo pointing at /auth/confirm — without it GoTrue falls back to the Site URL instead of landing on AuthConfirmClient", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "user-1" }, session: null }, error: null });
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.signUp({ email: "jamie@example.com", password: "correcthorse1", fullName: "Jamie Rivera" });

    expect(signUpMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "jamie@example.com",
        options: expect.objectContaining({ emailRedirectTo: "http://localhost:3000/auth/confirm" }),
      }),
    );
  });

  it("uses the production URL when built for production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    signUpMock.mockResolvedValue({ data: { user: { id: "user-1" }, session: null }, error: null });
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.signUp({ email: "jamie@example.com", password: "correcthorse1" });

    expect(signUpMock).toHaveBeenCalledWith(
      expect.objectContaining({ options: expect.objectContaining({ emailRedirectTo: "https://realoffer-ai.vercel.app/auth/confirm" }) }),
    );
  });
});

describe("AuthProvider — confirmEmail — PKCE code format", () => {
  it("exchanges the code for a session via Supabase's exchangeCodeForSession", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ data: { session: {} }, error: null });
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const response = await result.current.confirmEmail({ code: "the-pkce-code" });

    expect(response.error).toBeNull();
    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith("the-pkce-code");
    expect(verifyOtpMock).not.toHaveBeenCalled();
  });

  it("surfaces an expired/invalid/already-used code as an error", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ data: { session: null }, error: { message: "invalid flow state, no valid flow state found" } });
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const response = await result.current.confirmEmail({ code: "a-stale-code" });

    expect(response.error).toBe("invalid flow state, no valid flow state found");
  });
});

describe("AuthProvider — confirmEmail — token_hash + type format", () => {
  it("verifies via Supabase's verifyOtp — this is what GoTrue's hosted /verify redirect (the default, unedited 'Confirm signup' template) actually produces", async () => {
    verifyOtpMock.mockResolvedValue({ data: { session: {} }, error: null });
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const response = await result.current.confirmEmail({ tokenHash: "the-token-hash", type: "signup" });

    expect(response.error).toBeNull();
    expect(verifyOtpMock).toHaveBeenCalledWith({ token_hash: "the-token-hash", type: "signup" });
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
  });

  it("surfaces a genuinely expired token as an error", async () => {
    verifyOtpMock.mockResolvedValue({ data: { session: null }, error: { message: "Token has expired or is invalid" } });
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const response = await result.current.confirmEmail({ tokenHash: "an-expired-token", type: "signup" });

    expect(response.error).toBe("Token has expired or is invalid");
  });

  it("surfaces a reused (already-verified) token as an error", async () => {
    verifyOtpMock.mockResolvedValue({ data: { session: null }, error: { message: "Token has expired or is invalid" } });
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const response = await result.current.confirmEmail({ tokenHash: "an-already-used-token", type: "signup" });

    expect(response.error).toBe("Token has expired or is invalid");
  });

  it("passes through whatever EmailOtpType value the link carries (e.g. 'email', not just 'signup')", async () => {
    verifyOtpMock.mockResolvedValue({ data: { session: {} }, error: null });
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.confirmEmail({ tokenHash: "the-token-hash", type: "email" });

    expect(verifyOtpMock).toHaveBeenCalledWith({ token_hash: "the-token-hash", type: "email" });
  });
});

describe("AuthProvider — resendVerificationEmail", () => {
  it("calls Supabase's resend with type: signup, a trimmed email, and the same /auth/confirm redirect used at signup", async () => {
    resendMock.mockResolvedValue({ error: null });
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const response = await result.current.resendVerificationEmail("  jamie@example.com  ");

    expect(response.error).toBeNull();
    expect(resendMock).toHaveBeenCalledWith({
      type: "signup",
      email: "jamie@example.com",
      options: { emailRedirectTo: "http://localhost:3000/auth/confirm" },
    });
  });

  it("surfaces a genuine failure as an error", async () => {
    resendMock.mockResolvedValue({ error: { message: "Email rate limit exceeded" } });
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const response = await result.current.resendVerificationEmail("jamie@example.com");

    expect(response.error).toBe("Email rate limit exceeded");
  });
});
