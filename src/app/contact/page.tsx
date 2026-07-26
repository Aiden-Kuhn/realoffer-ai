import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ContactSupportPage } from "@/components/support/ContactSupportPage";

export const metadata: Metadata = { title: "Contact & Support — RealOffer AI" };

/**
 * Reachable by anyone, logged in or not — unlike /login, /signup, and
 * /dashboard, there is no auth guard/redirect here. The server-side auth
 * check below only decides which target the bottom CTA's secondary button
 * points at ("Return to Dashboard" vs "Return Home") and prefills the
 * contact form's name/email for a signed-in visitor — checked here rather
 * than client-side so that decision is correct on the very first render,
 * matching the same getUser() pattern used in app/login/page.tsx.
 */
export default async function ContactPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fullName = typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";

  return <ContactSupportPage isAuthenticated={!!user} userEmail={user?.email ?? ""} userFullName={fullName} />;
}
