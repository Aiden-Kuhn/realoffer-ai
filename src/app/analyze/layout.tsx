import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side auth guard for the focused, distraction-free analysis flow —
 * same check as app/dashboard/layout.tsx, but deliberately does NOT render
 * DashboardShell (no sidebar/top bar). Kept as its own layout rather than an
 * inline check in page.tsx so any future page added under /analyze inherits
 * the same guard automatically.
 */
export default async function AnalyzeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent("/analyze")}`);
  }

  return <>{children}</>;
}
