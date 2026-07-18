"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { AppUser, AuthProviderContract, AuthResult } from "@/lib/auth/types";

const AuthContext = createContext<AuthProviderContract | null>(null);

function toAppUser(user: User | null): AppUser | null {
  if (!user || !user.email) return null;
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: user.id,
    email: user.email,
    fullName: typeof metadata.full_name === "string" ? metadata.full_name : "",
    companyName: typeof metadata.company_name === "string" ? metadata.company_name : "",
    createdAt: user.created_at,
  };
}

/**
 * Real Supabase-backed authentication. The browser client stores its
 * session in cookies (via @supabase/ssr), so server reads (Server
 * Components, Server Actions, src/proxy.ts) stay in sync automatically —
 * no manual token passing needed.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mountedRef.current) return;
      setUser(toAppUser(data.session?.user ?? null));
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mountedRef.current) return;
      setUser(toAppUser(session?.user ?? null));
      setIsLoading(false);
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = useCallback<AuthProviderContract["signIn"]>(
    async ({ email, password }) => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return { error: error ? friendlyAuthError(error.message) : null };
    },
    [supabase],
  );

  const signUp = useCallback<AuthProviderContract["signUp"]>(
    async ({ email, password, fullName, companyName }) => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName?.trim() ?? "",
            company_name: companyName?.trim() ?? "",
          },
        },
      });
      if (error) return { error: friendlyAuthError(error.message), needsEmailConfirmation: false };
      // Supabase deliberately returns 200 with no error and an empty
      // `identities` array when the email already belongs to a confirmed
      // account, specifically so a signup form can't be used to enumerate
      // registered emails. Do not special-case this — show the same
      // "check your email" outcome either way, exactly as Supabase intends.
      // Supabase returns a user but no session when email confirmation is
      // required (this is also true for the already-registered case above)
      // — the caller needs to know so it can show the right UI instead of
      // assuming an active session was created.
      const needsEmailConfirmation = data.user !== null && data.session === null;
      return { error: null, needsEmailConfirmation };
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const value = useMemo<AuthProviderContract>(
    () => ({ user, isLoading, signIn, signUp, signOut }),
    [user, isLoading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Supabase's raw error messages are accurate but written for developers
 * ("Invalid login credentials", "User already registered") — pass most
 * through as-is since they're already reasonably user-facing, but smooth
 * over the handful that read oddly in a login form. */
function friendlyAuthError(message: string): string {
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }
  return message;
}

export function useAuth(): AuthProviderContract {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export type { AuthResult };
