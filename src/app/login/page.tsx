import type { Metadata } from "next";
import { DemoAuthForm } from "@/components/auth/DemoAuthForm";

export const metadata: Metadata = { title: "Log In — RealOffer AI (Demo)" };

export default function LoginPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-4 py-12">
      <DemoAuthForm mode="login" />
    </div>
  );
}
