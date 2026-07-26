import type { ContactSupportFormValues } from "@/lib/validation/schemas";

export const SUPPORT_EMAIL = "realoffersupport@gmail.com";

/**
 * mailto: URLs have no formal length limit, but in practice several mail
 * clients and OS URL handlers silently truncate or refuse to open very long
 * ones. Treating a URL over this length as a hard failure (rather than
 * launching something that might arrive incomplete) is safer than guessing.
 */
const MAX_MAILTO_URL_LENGTH = 1800;

export type SupportRequestInput = Omit<ContactSupportFormValues, "company"> & {
  /** ISO timestamp of submission, included in the email body for support's own reference. */
  submittedAt: string;
};

/** Pure and independently testable: builds the mailto: URL without touching `window`. */
export function buildSupportMailtoUrl(input: SupportRequestInput): string {
  const subject = `RealOffer AI Support Request: ${input.subject}`;
  const body = [
    `Category: ${input.category}`,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Submitted: ${input.submittedAt}`,
    "",
    "Message:",
    input.message,
  ].join("\n");
  const params = new URLSearchParams({ subject, body });
  return `mailto:${SUPPORT_EMAIL}?${params.toString()}`;
}

export type SubmitSupportRequestResult = { error: string | null };

/**
 * TEMPORARY implementation. This project has no transactional email
 * provider configured (no Resend/SendGrid/SMTP client anywhere in the
 * codebase — the only outgoing email today is Supabase's own built-in auth
 * email, see lib/auth/AuthProvider.tsx). Building a fake "message sent"
 * confirmation without anything actually sending it would be worse than no
 * form at all, so until a real backend exists, this constructs a mailto:
 * link addressed to support — pre-filled with the form's contents — and
 * opens the visitor's own email client so *they* send it.
 *
 * Deliberately returns a Promise, and takes the exact same shape of input
 * a future "POST to /api/support" call would take, so ContactSupportForm's
 * loading/success/error states and call site don't need to change at all
 * when this is swapped for a real backend endpoint later — only this
 * function's body would change.
 */
export async function submitSupportRequest(input: SupportRequestInput): Promise<SubmitSupportRequestResult> {
  try {
    const mailtoUrl = buildSupportMailtoUrl(input);
    if (mailtoUrl.length > MAX_MAILTO_URL_LENGTH) {
      return { error: `Your message is too long to send this way. Please shorten it or email ${SUPPORT_EMAIL} directly.` };
    }
    window.location.href = mailtoUrl;
    return { error: null };
  } catch {
    return { error: "Something went wrong opening your email application. Please try again." };
  }
}
