import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard — RealOffer AI",
};

/**
 * Server-side auth guard: redirects before any dashboard HTML ships, so an
 * unauthenticated visitor never sees a flash of the dashboard shell (the
 * client-side check in DashboardShell is a defensive fallback only, for the
 * rare case a session expires between this check and hydration).
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
