import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot Password — RealOffer AI" };

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-4 py-12">
      <ForgotPasswordForm />
    </div>
  );
}
