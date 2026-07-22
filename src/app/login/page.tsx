import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Log In — RealOffer AI" };

/**
 * Server-side check so an already-authenticated visitor who lands here
 * (an old tab, a stale bookmark, typing the URL from habit) is bounced
 * straight to the dashboard instead of sitting on the login form — which
 * would otherwise read as "I got logged out" even though the session is
 * still valid. Mirrors the guard in app/dashboard/layout.tsx.
 */
export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-4 py-12">
      <LoginForm />
    </div>
  );
}
