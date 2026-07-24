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
}
