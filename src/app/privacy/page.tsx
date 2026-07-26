import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PrivacyPolicyPage } from "@/components/legal/PrivacyPolicyPage";

export const metadata: Metadata = {
  title: "Privacy Policy | RealOfferAI",
  description: "How RealOfferAI collects, uses, stores, and shares information when you access our website and application.",
};

/**
 * Reachable by anyone, logged in or not — same pattern as app/contact/page.tsx.
 * The server-side auth check only decides the destination/label of the
 * top "Back" link.
 */
export default async function PrivacyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <PrivacyPolicyPage isAuthenticated={!!user} />;
}
