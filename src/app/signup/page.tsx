import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/SignupForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign Up — RealOffer AI" };

/** Same already-authenticated guard as app/login/page.tsx — see its comment. */
export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-4 py-12">
      <SignupForm />
    </div>
  );
}
