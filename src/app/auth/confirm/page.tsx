import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthConfirmClient } from "@/components/auth/AuthConfirmClient";

export const metadata: Metadata = { title: "Verifying Email — RealOffer AI" };

/**
 * Landing point for Supabase's "Confirm signup" email link. Deliberately no
 * server-side auth guard here (unlike app/login and app/signup) — a visitor
 * arriving with a valid code doesn't have a session *yet*; AuthConfirmClient
 * is what establishes one, then hard-navigates to /dashboard once it does.
 *
 * The Suspense boundary is required because AuthConfirmClient reads
 * useSearchParams() (for the `code` param) and this route has no
 * server-side data fetch of its own — without it, Next can't statically
 * prerender the page at build time.
 */
export default function AuthConfirmPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-4 py-12">
      <Suspense>
        <AuthConfirmClient />
      </Suspense>
    </div>
  );
}
