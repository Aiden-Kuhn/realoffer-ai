"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { PageHeaderProvider } from "@/components/dashboard/PageHeaderContext";

/**
 * The layout's Server Component already redirects unauthenticated visitors
 * before any HTML ships (see app/dashboard/layout.tsx) — the check here is
 * a client-side fallback only, for a session that expires or is signed out
 * (e.g. in another tab) after that initial server check already passed.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  if (isLoading || !user) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-accent-3" />
      </div>
    );
  }

  return (
    <PageHeaderProvider>
      <div className="flex h-dvh overflow-hidden bg-background text-white">
        <div className="hidden md:block shrink-0">
          <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((v) => !v)} />
        </div>

        {mobileNavOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setMobileNavOpen(false)}
              className="absolute inset-0 bg-black/70"
            />
            <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw]">
              <Sidebar collapsed={false} onToggleCollapsed={() => setMobileNavOpen(false)} onNavigate={() => setMobileNavOpen(false)} />
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setMobileNavOpen(false)}
                className="absolute -right-11 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface border border-border text-white/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onOpenMobileNav={() => setMobileNavOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
          </main>
        </div>
      </div>
    </PageHeaderProvider>
  );
}
