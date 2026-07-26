"use client";

import { useId, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/support/submitSupportRequest";

const SupportEmailLink = () => (
  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent-3 hover:text-accent-3/80 underline transition-colors">
    {SUPPORT_EMAIL}
  </a>
);

type SupportFaqItem = { question: string; answer: ReactNode };

const SUPPORT_FAQS: SupportFaqItem[] = [
  {
    question: "What does RealOfferAI do?",
    answer:
      "RealOfferAI helps real estate investors evaluate potential deals by organizing property information, comparable sales, repair estimates, projected values, offer calculations, risks, and contract tools in one place.",
  },
  {
    question: "Are RealOfferAI estimates guaranteed?",
    answer:
      "No. Property values, repair costs, rent estimates, comparable sales, and investment calculations are estimates based on available information. Users should independently verify all information and consult qualified real estate, legal, financial, or construction professionals before making a decision.",
  },
  {
    question: "Where does the property information come from?",
    answer:
      "RealOfferAI uses available property data and third-party data sources to generate its analysis. Coverage and accuracy may vary by property and location, so users should confirm important details before submitting an offer.",
  },
  {
    question: "Can I use RealOfferAI to determine my final offer price?",
    answer:
      "RealOfferAI can help users estimate a potential opening offer and maximum allowable offer, but those figures should be treated as decision-support tools rather than guaranteed recommendations. Final offers should reflect the user's own strategy, due diligence, financing, repair assumptions, and local market conditions.",
  },
  {
    question: "Can I save properties and return to them later?",
    answer: "Yes. Signed-in users can save analyzed properties and revisit their deal information from the Saved Deals area.",
  },
  {
    question: "Can RealOfferAI generate purchase agreements?",
    answer:
      "RealOfferAI can help generate contract documents using information entered by the user. Users are responsible for reviewing all contract terms and ensuring the document is appropriate and legally valid in the relevant state or jurisdiction. Legal review is recommended.",
  },
  {
    question: "How do I report inaccurate property information?",
    answer: (
      <>
        Email <SupportEmailLink /> and include the property address, the information you believe is incorrect, and any supporting details. This
        feedback can help us investigate the issue.
      </>
    ),
  },
  {
    question: "How do I reset my password?",
    answer:
      "Use the Forgot Password option on the login page and follow the reset instructions sent to your email address. Check your spam folder if the email does not appear.",
  },
  {
    question: "How do I cancel or manage my subscription?",
    answer: (
      <>
        Once subscriptions are available, users will be able to manage their billing and subscription from their account settings. For additional
        help, contact <SupportEmailLink />.
      </>
    ),
  },
  {
    question: "Does RealOfferAI provide legal, financial, or real estate advice?",
    answer:
      "No. RealOfferAI provides software tools and informational estimates. It does not replace advice from a licensed attorney, accountant, real estate professional, appraiser, contractor, or financial adviser.",
  },
  {
    question: "How quickly will support respond?",
    answer: "We aim to respond within 1–2 business days. More complex technical or property-data questions may require additional time.",
  },
  {
    question: "Can I suggest a new feature?",
    answer: (
      <>
        Yes. Select Feature Request in the contact form or email <SupportEmailLink />. User feedback will help guide future improvements.
      </>
    ),
  },
];

/**
 * Same visual/interaction pattern as components/sections/FAQ.tsx (the
 * landing page's FAQ), with fuller ARIA wiring added on top since this is
 * the one place in the app an accessibility audit is most likely to land:
 * each trigger gets a stable id + aria-controls pointing at its panel, and
 * the panel gets role="region" + aria-labelledby pointing back.
 */
export function SupportFAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const baseId = useId();

  return (
    <div className="flex flex-col gap-3">
      {SUPPORT_FAQS.map((faq, index) => {
        const isOpen = openIndex === index;
        const buttonId = `${baseId}-faq-trigger-${index}`;
        const panelId = `${baseId}-faq-panel-${index}`;
        return (
          <div key={faq.question} className={`rounded-2xl border transition-colors ${isOpen ? "border-border-strong bg-surface-2" : "border-border bg-surface"}`}>
            <h3 className="contents">
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 sm:px-6 sm:py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                <span className="text-[15px] font-medium text-white">{faq.question}</span>
                <motion.span
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ duration: 0.2 }}
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/70"
                >
                  <Plus className="h-3.5 w-3.5" />
                </motion.span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-4 sm:px-6 sm:pb-5 text-sm leading-relaxed text-muted">{faq.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
