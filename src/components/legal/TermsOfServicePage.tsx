import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { LegalSection } from "@/components/legal/LegalSection";
import { SupportEmailLink } from "@/components/legal/SupportEmailLink";
import type { LegalTocEntry } from "@/components/legal/LegalTableOfContents";

const SECTIONS: LegalTocEntry[] = [
  { id: "acceptance", title: "1. Acceptance of Terms" },
  { id: "eligibility", title: "2. Eligibility" },
  { id: "description-of-service", title: "3. Description of the Service" },
  { id: "no-professional-advice", title: "4. No Professional Advice" },
  { id: "estimates-and-limitations", title: "5. Estimates and Data Limitations" },
  { id: "user-responsibility", title: "6. User Responsibility and Due Diligence" },
  { id: "contract-generation-tools", title: "7. Contract-Generation Tools" },
  { id: "accounts-and-security", title: "8. Accounts and Security" },
  { id: "acceptable-use", title: "9. Acceptable Use" },
  { id: "user-content", title: "10. User Content" },
  { id: "third-party-services", title: "11. Third-Party Services and Links" },
  { id: "subscriptions-and-billing", title: "12. Subscriptions and Billing" },
  { id: "service-availability", title: "13. Service Availability" },
  { id: "intellectual-property", title: "14. Intellectual Property" },
  { id: "feedback", title: "15. Feedback" },
  { id: "suspension-and-termination", title: "16. Suspension and Termination" },
  { id: "disclaimers", title: "17. Disclaimers" },
  { id: "limitation-of-liability", title: "18. Limitation of Liability" },
  { id: "indemnification", title: "19. Indemnification" },
  { id: "governing-law", title: "20. Governing Law and Disputes" },
  { id: "changes-to-terms", title: "21. Changes to Terms" },
  { id: "contact", title: "22. Contact" },
];

const listClasses = "list-disc pl-5 flex flex-col gap-1.5 marker:text-white/25";

const legalReviewNoteClasses = "rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-xs leading-relaxed text-amber-200";

type TermsOfServicePageProps = {
  isAuthenticated: boolean;
};

export function TermsOfServicePage({ isAuthenticated }: TermsOfServicePageProps) {
  return (
    <LegalPageLayout
      title="Terms of Service"
      introduction="These Terms govern your access to and use of RealOfferAI. Please read them carefully."
      isAuthenticated={isAuthenticated}
      sections={SECTIONS}
    >
      <LegalSection id="acceptance" title="1. Acceptance of Terms">
        <p>
          By creating an account, accessing the service, or otherwise using RealOfferAI, you agree to these Terms of Service and our Privacy
          Policy. If you do not agree, do not use RealOfferAI.
        </p>
      </LegalSection>

      <LegalSection id="eligibility" title="2. Eligibility">
        <p>
          You must be at least 18 years old and legally capable of entering into a binding agreement to use RealOfferAI. Because this product
          involves real estate decisions and contract-generation tools, it is not intended for use by minors.
        </p>
      </LegalSection>

      <LegalSection id="description-of-service" title="3. Description of the Service">
        <p>RealOfferAI provides software tools that may help users:</p>
        <ul className={listClasses}>
          <li>Organize property information</li>
          <li>Review comparable properties</li>
          <li>Estimate potential after-repair value</li>
          <li>Estimate repair costs</li>
          <li>Calculate potential offers</li>
          <li>Evaluate potential returns and risks</li>
          <li>Save deals</li>
          <li>Generate draft contract documents</li>
          <li>Review software-generated analysis</li>
        </ul>
        <p>Features may change, and may be added, removed, suspended, or updated at any time.</p>
      </LegalSection>

      <LegalSection id="no-professional-advice" title="4. No Professional Advice">
        <p>RealOfferAI does not provide:</p>
        <ul className={listClasses}>
          <li>Legal advice</li>
          <li>Financial advice</li>
          <li>Tax advice</li>
          <li>Investment advice</li>
          <li>Brokerage services</li>
          <li>Appraisal services</li>
          <li>Property inspections</li>
          <li>Contractor estimates</li>
          <li>Lending services</li>
          <li>Title services</li>
        </ul>
        <p>
          You should consult qualified professionals before making real estate, financial, contractual, or legal decisions.
        </p>
      </LegalSection>

      <LegalSection id="estimates-and-limitations" title="5. Estimates and Data Limitations">
        <ul className={listClasses}>
          <li>Property values shown in RealOfferAI are estimates</li>
          <li>Estimated after-repair value (ARV) is not an appraisal</li>
          <li>Repair estimates are not contractor bids</li>
          <li>Rent estimates are not guarantees</li>
          <li>Comparable properties may not reflect true closed sales</li>
          <li>Third-party data may be delayed, missing, incorrect, or incomplete</li>
          <li>Market conditions may change</li>
          <li>Calculations depend on assumptions entered by the user</li>
          <li>No profit, resale value, rent, financing, closing, or investment outcome is guaranteed</li>
        </ul>
        <p>You must independently verify all information before submitting an offer or completing a transaction.</p>
      </LegalSection>

      <LegalSection id="user-responsibility" title="6. User Responsibility and Due Diligence">
        <p>You are solely responsible for:</p>
        <ul className={listClasses}>
          <li>Inspecting properties</li>
          <li>Validating ownership</li>
          <li>Confirming liens and title</li>
          <li>Checking zoning and permits</li>
          <li>Reviewing taxes and assessments</li>
          <li>Verifying property condition</li>
          <li>Confirming repair costs</li>
          <li>Confirming comparable sales</li>
          <li>Determining financing</li>
          <li>Reviewing contracts</li>
          <li>Complying with applicable local, state, and federal law</li>
          <li>Obtaining any required licenses or disclosures</li>
          <li>Determining whether wholesaling or assignment activity is lawful in your jurisdiction</li>
        </ul>
        <p>RealOfferAI does not provide state-specific legal conclusions.</p>
      </LegalSection>

      <LegalSection id="contract-generation-tools" title="7. Contract-Generation Tools">
        <p>Contracts generated through RealOfferAI are:</p>
        <ul className={listClasses}>
          <li>Drafts and templates</li>
          <li>Based on information you enter</li>
          <li>Not guaranteed to be legally valid in your state or jurisdiction</li>
          <li>Not customized legal advice</li>
          <li>Not a substitute for attorney review</li>
        </ul>
        <p>
          You are responsible for reviewing, editing, and confirming every contract term before use. RealOfferAI is not a party to any contract
          created through the service.
        </p>
      </LegalSection>

      <LegalSection id="accounts-and-security" title="8. Accounts and Security">
        <p>You are responsible for:</p>
        <ul className={listClasses}>
          <li>Providing accurate information</li>
          <li>Maintaining secure login credentials</li>
          <li>Protecting access to your email</li>
          <li>Reporting any unauthorized use of your account</li>
          <li>Keeping your account information current</li>
        </ul>
        <p>RealOfferAI may suspend or restrict accounts associated with fraud, abuse, security threats, or violations of these Terms.</p>
      </LegalSection>

      <LegalSection id="acceptable-use" title="9. Acceptable Use">
        <p>You agree not to:</p>
        <ul className={listClasses}>
          <li>Break applicable laws</li>
          <li>Commit fraud</li>
          <li>Misrepresent property information</li>
          <li>Impersonate any person or entity</li>
          <li>Infringe intellectual property rights</li>
          <li>Attempt unauthorized access to the service</li>
          <li>Disrupt the service</li>
          <li>Scrape or extract data at scale without permission</li>
          <li>Bypass usage limits</li>
          <li>Reverse engineer restricted portions of the platform</li>
          <li>Upload malware</li>
          <li>Use the service to send spam</li>
          <li>Use generated documents for unlawful transactions</li>
          <li>Exploit third-party property data</li>
          <li>Use automated systems in a way that harms performance</li>
        </ul>
      </LegalSection>

      <LegalSection id="user-content" title="10. User Content">
        <p>
          You retain ownership of the information you submit to RealOfferAI. You grant RealOfferAI a limited license to process submitted
          information only as reasonably necessary to operate the service, save deals, generate analysis, create documents, provide support, and
          improve reliability and security.
        </p>
        <p>You must confirm that you have the right to submit any personal or property-related information you provide.</p>
      </LegalSection>

      <LegalSection id="third-party-services" title="11. Third-Party Services and Links">
        <p>
          RealOfferAI may rely on or link to third-party services. RealOfferAI is not responsible for third-party availability, accuracy,
          privacy practices, terms, external websites, or third-party property listings.
        </p>
      </LegalSection>

      <LegalSection id="subscriptions-and-billing" title="12. Subscriptions and Billing">
        <p>
          RealOfferAI does not currently charge for access. If and when paid subscriptions are introduced, the following will apply:
        </p>
        <ul className={listClasses}>
          <li>Applicable pricing will be shown before purchase</li>
          <li>Subscriptions may renew automatically</li>
          <li>Billing will be processed by a third-party payment processor</li>
          <li>You are responsible for any applicable taxes</li>
          <li>You may manage or cancel your subscription through the account or billing controls made available at that time</li>
          <li>Cancellation generally prevents future renewals but does not retroactively refund completed billing periods</li>
          <li>Access may continue through the end of the paid billing period</li>
          <li>Failed payments may result in restricted access</li>
        </ul>
        <p>Except where required by law or expressly stated at the time of purchase, payments are generally nonrefundable.</p>
      </LegalSection>

      <LegalSection id="service-availability" title="13. Service Availability">
        <p>RealOfferAI does not guarantee uninterrupted or error-free service. The service may be unavailable due to:</p>
        <ul className={listClasses}>
          <li>Maintenance</li>
          <li>Provider outages</li>
          <li>Data-provider failures</li>
          <li>Technical issues</li>
          <li>Security concerns</li>
          <li>Circumstances outside RealOfferAI&apos;s control</li>
        </ul>
      </LegalSection>

      <LegalSection id="intellectual-property" title="14. Intellectual Property">
        <p>
          RealOfferAI&apos;s software, branding, design, interfaces, and original content are protected by applicable intellectual-property
          laws. You receive a limited, nonexclusive, nontransferable, revocable right to use the service for lawful internal business or
          personal purposes.
        </p>
      </LegalSection>

      <LegalSection id="feedback" title="15. Feedback">
        <p>
          You may submit suggestions or feedback about RealOfferAI. RealOfferAI may use that feedback without any obligation to compensate you.
          This does not give RealOfferAI ownership over your private deal data.
        </p>
      </LegalSection>

      <LegalSection id="suspension-and-termination" title="16. Suspension and Termination">
        <p>RealOfferAI may suspend or terminate your access for:</p>
        <ul className={listClasses}>
          <li>Violation of these Terms</li>
          <li>Fraud or illegal conduct</li>
          <li>Abuse or security risks</li>
          <li>Nonpayment</li>
          <li>Misuse of data</li>
          <li>Harm to the service or other users</li>
        </ul>
        <p>
          You may stop using the service at any time and may request account deletion by emailing <SupportEmailLink />.
        </p>
      </LegalSection>

      <LegalSection id="disclaimers" title="17. Disclaimers">
        <p>
          To the extent permitted by law, RealOfferAI is provided on an &quot;as is&quot; and &quot;as available&quot; basis. RealOfferAI does
          not warrant:
        </p>
        <ul className={listClasses}>
          <li>Data accuracy</li>
          <li>Successful transactions</li>
          <li>Profitability</li>
          <li>Financing</li>
          <li>Contract enforceability</li>
          <li>Property condition</li>
          <li>Uninterrupted availability</li>
          <li>Fitness for any particular investment strategy</li>
        </ul>
      </LegalSection>

      <LegalSection id="limitation-of-liability" title="18. Limitation of Liability">
        <p>
          To the extent permitted by law, RealOfferAI&apos;s total liability for any claim arising out of or relating to the service is limited
          to the greater of (a) the amount you paid RealOfferAI in the recent period preceding the claim, or (b) a modest fixed amount.
        </p>
        <div className={legalReviewNoteClasses}>
          Flagged for founder review: no formal business entity or billing structure exists yet, so no specific dollar cap has been inserted
          here. This section should be finalized with a lawyer before public launch.
        </div>
      </LegalSection>

      <LegalSection id="indemnification" title="19. Indemnification">
        <p>
          You agree to defend and indemnify RealOfferAI against claims arising from your unlawful use of the service, violation of these Terms,
          content you submit, contracts or transactions you enter into, or your violation of any third party&apos;s rights.
        </p>
        <div className={legalReviewNoteClasses}>
          Flagged for founder review: standard SaaS indemnification language, included here for completeness — confirm scope and proportionality
          with a lawyer before public launch.
        </div>
      </LegalSection>

      <LegalSection id="governing-law" title="20. Governing Law and Disputes">
        <p className="text-white font-medium">[GOVERNING STATE AND VENUE TO BE CONFIRMED BEFORE LAUNCH]</p>
        <div className={legalReviewNoteClasses}>
          Flagged for founder review: no governing state, venue, or arbitration requirement has been chosen. This section must be finalized
          before launch — do not add mandatory arbitration or a class-action waiver without founder approval and legal review.
        </div>
      </LegalSection>

      <LegalSection id="changes-to-terms" title="21. Changes to Terms">
        <p>
          RealOfferAI may update these Terms from time to time. The updated date will be posted on this page. Continued use of the service after
          an update means you accept the revised Terms, to the extent permitted by applicable law.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="22. Contact">
        <p>Questions about these Terms can be directed to:</p>
        <p className="text-white">
          RealOfferAI
          <br />
          Email: <SupportEmailLink />
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
