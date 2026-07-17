import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 text-center">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent via-accent-2 to-accent-3">
          <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
        </span>
        <span className="text-[15px] font-semibold tracking-tight text-white">
          RealOffer <span className="text-muted font-normal">AI</span>
        </span>
      </Link>
      <p className="text-sm font-medium text-accent-3">404</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-white">Page not found</h1>
      <p className="mt-3 max-w-sm text-sm text-muted leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist, moved, or was never published.
      </p>
      <Button href="/" variant="primary" size="md" className="mt-8">
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Button>
    </div>
  );
}
