import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type BackNavigationLinkProps = {
  isAuthenticated: boolean;
};

/**
 * Same subtle text-link treatment already used for "Back to dashboard" on
 * the Analyze page and Contact & Support page (ArrowLeft + text-muted,
 * brightening to white on hover). Destination and label adapt to auth
 * state since legal pages are reachable both from inside the dashboard and
 * from the logged-out marketing site.
 */
export function BackNavigationLink({ isAuthenticated }: BackNavigationLinkProps) {
  return (
    <Link
      href={isAuthenticated ? "/dashboard" : "/"}
      className="inline-flex items-center gap-1.5 self-start text-sm text-muted hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded-full px-1"
    >
      <ArrowLeft className="h-4 w-4" />
      {isAuthenticated ? "Back to dashboard" : "Back to home"}
    </Link>
  );
}
