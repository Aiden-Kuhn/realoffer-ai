import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * App-facing user shape, derived from Supabase's `User` object so consuming
 * components never touch the Supabase SDK types directly.
 */
export type AppUser = {
  id: string;
  email: string;
  fullName: string;
  companyName: string;
  createdAt: string;
};

export type AuthResult = { error: string | null };

export interface AuthProviderContract {
  user: AppUser | null;
  isLoading: boolean;
  signIn(input: { email: string; password: string }): Promise<AuthResult>;
  signUp(input: { email: string; password: string; fullName?: string; companyName?: string }): Promise<AuthResult & { needsEmailConfirmation: boolean }>;
  signOut(): Promise<void>;
  sendPasswordResetEmail(email: string): Promise<AuthResult>;
  updatePassword(newPassword: string): Promise<AuthResult>;
  /**
   * For a logged-in user changing their own password (Settings), as
   * distinct from updatePassword above (used only from the email-recovery
   * session on /reset-password). Deliberately takes no email/user id — the
   * account being updated is always the current session's own user, read
   * internally from `user.email`, never from a caller-supplied value.
   */
  changePassword(currentPassword: string, newPassword: string): Promise<AuthResult>;
  /**
   * Completes email verification (see AuthConfirmClient) for whichever of
   * Supabase's two link formats actually arrived: a PKCE `code` (exchanged
   * via exchangeCodeForSession) or a `token_hash`+`type` pair (verified via
   * verifyOtp — this is what GoTrue's *hosted* confirmation-link redirect
   * produces, which is what the unedited default "Confirm signup" email
   * template points at). Deliberately takes only these — never an email or
   * user id — since the resulting session is whichever account the
   * code/token was issued for; there is no way to point this at a
   * different account.
   */
  confirmEmail(input: { code: string } | { tokenHash: string; type: EmailOtpType }): Promise<AuthResult>;
  resendVerificationEmail(email: string): Promise<AuthResult>;
}
