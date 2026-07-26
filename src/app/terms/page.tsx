import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TermsOfServicePage } from "@/components/legal/TermsOfServicePage";

export const metadata: Metadata = {
  title: "Terms of Service | RealOfferAI",
  description: "The terms that govern access to and use of RealOfferAI.",
};

/**
 * Reachable by anyone, logged in or not — same pattern as app/contact/page.tsx.
 * The server-side auth check only decides the destination/label of the
 * top "Back" link.
 */
export default async function TermsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <TermsOfServicePage isAuthenticated={!!user} />;
}
