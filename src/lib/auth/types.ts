/**
 * Demo-only session shape. This is intentionally minimal so a real
 * provider (e.g. Supabase) can be swapped in behind the same AuthProvider
 * / useAuth contract without touching consuming components.
 */
export type DemoUser = {
  name: string;
  email: string;
  companyName: string;
  createdAt: string;
};

export interface AuthProviderContract {
  user: DemoUser | null;
  isLoading: boolean;
  signIn(input: { name: string; email: string; companyName?: string }): void;
  signOut(): void;
}
