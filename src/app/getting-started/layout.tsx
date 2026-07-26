import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side auth guard — same pattern as app/analyze/layout.tsx. Getting
 * Started is a permanent, authenticated-only reference page (unlike
 * /contact, /privacy, /terms, which are intentionally public), so it does
 * not render DashboardShell (no sidebar/top bar) and instead builds its own
 * focused page chrome, matching the standalone /analyze page.
 */
export default async function GettingStartedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent("/getting-started")}`);
  }

  return <>{children}</>;
}
