import Link from "next/link";
import { Sparkles } from "lucide-react";

// Working in-page links only. Pages that don't exist yet in this demo are
// listed as plain, clearly non-interactive text below rather than as dead
// links — see the "Coming soon" labeling in the render.
const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
};

const comingSoon = {
  Company: ["About", "Careers", "Blog", "Contact"],
  Resources: ["Deal Analysis Guide", "Investor Glossary", "API Docs"],
  Legal: ["Privacy Policy", "Terms of Service", "Security"],
};

export function Footer() {
  return (
    <footer className="relative border-t border-border">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-10">
          <div className="col-span-2 lg:col-span-2 pr-8">
            <Link href="#top" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent via-accent-2 to-accent-3">
                <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-white">
                RealOffer <span className="text-muted font-normal">AI</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              AI-powered deal analysis for real estate investors, wholesalers, and
              landlords. Paste an address, get a decision.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-white">{category}</h4>
              <ul className="mt-4 flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {Object.entries(comingSoon).map(([category, labels]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-white">{category}</h4>
              <ul className="mt-4 flex flex-col gap-3">
                {labels.map((label) => (
                  <li key={label} className="flex items-center gap-1.5 text-sm text-muted/50 cursor-default select-none">
                    {label}
                    <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted/70">
                      Soon
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} RealOffer AI. All rights reserved.
          </p>
          <p className="text-sm text-muted">Made for investors who move fast.</p>
        </div>
      </div>
    </footer>
  );
}
