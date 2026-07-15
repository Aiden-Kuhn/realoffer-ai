"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { AuthProviderContract, DemoUser } from "@/lib/auth/types";

const STORAGE_KEY = "realoffer_demo_session_v1";

const AuthContext = createContext<AuthProviderContract | null>(null);

type Listener = () => void;
let listeners: Listener[] = [];

function emitChange(): void {
  for (const listener of listeners) listener();
}

function subscribe(onChange: Listener): () => void {
  listeners = [...listeners, onChange];
  window.addEventListener("storage", onChange);
  return () => {
    listeners = listeners.filter((l) => l !== onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): string | null {
  return window.localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot(): string | null {
  return null;
}

function parseUser(raw: string | null): DemoUser | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DemoUser;
  } catch {
    return null;
  }
}

/**
 * Demo-only authentication. No passwords are collected or stored. This is
 * a visual/UX simulation of an auth flow — swap the implementation for a
 * real provider (e.g. Supabase) behind this same context contract when
 * ready, without changing any consuming component.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const user = useMemo(() => parseUser(raw), [raw]);

  const signIn = useCallback<AuthProviderContract["signIn"]>(({ name, email, companyName }) => {
    const nextUser: DemoUser = {
      name: name.trim(),
      email: email.trim(),
      companyName: companyName?.trim() ?? "",
      createdAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    emitChange();
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    emitChange();
  }, []);

  const value = useMemo<AuthProviderContract>(
    () => ({ user, isLoading: false, signIn, signOut }),
    [user, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthProviderContract {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
