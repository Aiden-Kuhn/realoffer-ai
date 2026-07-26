import { SUPPORT_EMAIL } from "@/lib/support/submitSupportRequest";

/**
 * The single clickable support-email link reused throughout both legal
 * documents. Imports the same SUPPORT_EMAIL constant the Contact & Support
 * page uses, so the address only ever needs to be spelled correctly once.
 */
export function SupportEmailLink() {
  return (
    <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent-3 hover:text-accent-3/80 underline transition-colors">
      {SUPPORT_EMAIL}
    </a>
  );
}
