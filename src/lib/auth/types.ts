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
}
