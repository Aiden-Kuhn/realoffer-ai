import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { LegalSection } from "@/components/legal/LegalSection";
import { SupportEmailLink } from "@/components/legal/SupportEmailLink";
import type { LegalTocEntry } from "@/components/legal/LegalTableOfContents";

const SECTIONS: LegalTocEntry[] = [
  { id: "information-we-collect", title: "1. Information We Collect" },
  { id: "how-information-is-collected", title: "2. How Information Is Collected" },
  { id: "how-information-is-used", title: "3. How Information Is Used" },
  { id: "property-data", title: "4. Property Data and Third-Party Information" },
  { id: "how-information-may-be-shared", title: "5. How Information May Be Shared" },
  { id: "cookies", title: "6. Cookies and Similar Technologies" },
  { id: "data-retention", title: "7. Data Retention" },
  { id: "data-security", title: "8. Data Security" },
  { id: "user-choices-and-rights", title: "9. User Choices and Rights" },
  { id: "account-deletion", title: "10. Account Deletion" },
  { id: "childrens-privacy", title: "11. Children's Privacy" },
  { id: "international-users", title: "12. International Users" },
  { id: "changes", title: "13. Changes to This Privacy Policy" },
  { id: "contact", title: "14. Contact" },
];

const listClasses = "list-disc pl-5 flex flex-col gap-1.5 marker:text-white/25";

type PrivacyPolicyPageProps = {
  isAuthenticated: boolean;
};

export function PrivacyPolicyPage({ isAuthenticated }: PrivacyPolicyPageProps) {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      introduction="This policy describes how RealOfferAI collects, uses, stores, and shares information when you access our website and application."
      isAuthenticated={isAuthenticated}
      sections={SECTIONS}
    >
      <LegalSection id="information-we-collect" title="1. Information We Collect">
        <p>RealOfferAI may collect the following categories of information:</p>
        <div>
          <p className="text-white font-medium">Account information</p>
          <ul className={listClasses}>
            <li>Full name</li>
            <li>Email address</li>
            <li>Company name, if provided</li>
            <li>Authentication information managed through our authentication provider</li>
            <li>Account settings and default deal assumptions</li>
            <li>Subscription status, once billing is implemented</li>
          </ul>
        </div>
        <div>
          <p className="text-white font-medium">Property and deal information</p>
          <ul className={listClasses}>
            <li>Property addresses and details</li>
            <li>Purchase-price assumptions</li>
            <li>Repair estimates</li>
            <li>Comparable-property selections</li>
            <li>Offer calculations and deal scores</li>
            <li>Saved deals</li>
            <li>Generated contract information</li>
            <li>Buyer or seller information entered by the user</li>
            <li>Notes and other information voluntarily submitted by the user</li>
          </ul>
        </div>
        <div>
          <p className="text-white font-medium">Support information</p>
          <ul className={listClasses}>
            <li>Name and email</li>
            <li>Subject and support category</li>
            <li>Message content</li>
            <li>Technical details voluntarily provided with a support request</li>
          </ul>
        </div>
        <div>
          <p className="text-white font-medium">Technical information</p>
          <ul className={listClasses}>
            <li>IP address</li>
            <li>Browser type and device type</li>
            <li>Operating system</li>
            <li>Referring pages and pages viewed</li>
            <li>Interaction data and timestamps</li>
            <li>Approximate location derived from IP address</li>
            <li>Cookies or similar technologies</li>
          </ul>
          <p className="mt-2">
            RealOfferAI does not currently run a dedicated analytics service. If one is added in the future, this policy will be updated to
            describe what it collects before it is enabled.
          </p>
        </div>
      </LegalSection>

      <LegalSection id="how-information-is-collected" title="2. How Information Is Collected">
        <p>Information may be collected:</p>
        <ul className={listClasses}>
          <li>Directly from you, when you create an account, fill out a form, or submit a support request</li>
          <li>Automatically through your use of the application</li>
          <li>Through our authentication provider</li>
          <li>Through property-data providers, when you request an analysis</li>
          <li>Through analytics tools, if and when they are installed</li>
          <li>Through payment processors, once billing is active</li>
        </ul>
        <p>
          If a payment processor such as Stripe is implemented, payment-card information will be entered directly into that processor&apos;s
          own secure checkout and will not be stored on RealOfferAI&apos;s own servers.
        </p>
      </LegalSection>

      <LegalSection id="how-information-is-used" title="3. How Information Is Used">
        <p>Information may be used to:</p>
        <ul className={listClasses}>
          <li>Create and manage accounts</li>
          <li>Verify email addresses and authenticate users</li>
          <li>Provide property analysis features</li>
          <li>Save deals and contracts</li>
          <li>Generate requested documents</li>
          <li>Improve the accuracy and usability of the product</li>
          <li>Respond to support requests</li>
          <li>Prevent fraud and abuse</li>
          <li>Monitor reliability and security</li>
          <li>Comply with legal obligations</li>
          <li>Manage billing and subscriptions, once enabled</li>
        </ul>
        <p>RealOfferAI does not sell personal information for money.</p>
      </LegalSection>

      <LegalSection id="property-data" title="4. Property Data and Third-Party Information">
        <p>
          Property information displayed in RealOfferAI may come from third-party property-data providers and publicly available sources.
        </p>
        <ul className={listClasses}>
          <li>Third-party data may be incomplete, delayed, or inaccurate</li>
          <li>Users should independently verify important property information before relying on it</li>
          <li>Third-party providers may process requests under their own privacy policies</li>
        </ul>
      </LegalSection>

      <LegalSection id="how-information-may-be-shared" title="5. How Information May Be Shared">
        <p>Information may be shared with service providers reasonably necessary to operate RealOfferAI, such as:</p>
        <ul className={listClasses}>
          <li>Hosting providers</li>
          <li>Authentication and database providers</li>
          <li>Property-data providers</li>
          <li>Analytics providers, if and when installed</li>
          <li>Email providers</li>
          <li>Payment processors, once billing is active</li>
          <li>Security and fraud-prevention services</li>
          <li>Professional advisers</li>
          <li>Government authorities, when legally required</li>
        </ul>
        <p>
          Service providers only receive information reasonably necessary to perform their services. RealOfferAI does not list providers that
          are not actually in use.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="6. Cookies and Similar Technologies">
        <p>RealOfferAI uses cookies and browser storage for:</p>
        <ul className={listClasses}>
          <li>Authentication — keeping you signed in and managing your session</li>
          <li>Preferences — such as which section of a saved deal you last viewed</li>
          <li>Security — protecting the application from misuse</li>
          <li>Analytics, if and when an analytics service is installed</li>
        </ul>
        <p>
          RealOfferAI does not currently offer a dedicated cookie-preference center. You may control cookies through your browser settings, but
          disabling essential storage may prevent you from logging in or using core parts of the application.
        </p>
      </LegalSection>

      <LegalSection id="data-retention" title="7. Data Retention">
        <p>RealOfferAI may retain information for as long as:</p>
        <ul className={listClasses}>
          <li>Your account remains active</li>
          <li>It is needed to provide the service to you</li>
          <li>It is needed for security, fraud prevention, dispute resolution, legal compliance, or backup recovery</li>
        </ul>
        <p>Deleted information may remain temporarily in backups or logs before it is fully purged.</p>
      </LegalSection>

      <LegalSection id="data-security" title="8. Data Security">
        <p>
          RealOfferAI uses reasonable administrative, technical, and organizational safeguards designed to protect your information. However, no
          internet-based service can guarantee absolute security, and RealOfferAI cannot promise that information will never be accessed,
          disclosed, altered, or destroyed in a manner inconsistent with this policy.
        </p>
      </LegalSection>

      <LegalSection id="user-choices-and-rights" title="9. User Choices and Rights">
        <p>You may request:</p>
        <ul className={listClasses}>
          <li>Access to your account information</li>
          <li>Correction of inaccurate information</li>
          <li>Deletion of your account or personal information</li>
          <li>Information about how your data is handled</li>
          <li>Withdrawal from optional communications</li>
        </ul>
        <p>
          To make a request, contact <SupportEmailLink />. Some information may be retained where legally permitted or required. RealOfferAI
          does not guarantee an instant deletion or a specific response deadline unless one is required by applicable law.
        </p>
      </LegalSection>

      <LegalSection id="account-deletion" title="10. Account Deletion">
        <p>
          RealOfferAI does not currently offer a self-service &quot;delete my account&quot; button inside the application. To request deletion
          of your account, email <SupportEmailLink /> from the email address associated with your account.
        </p>
        <p>Deleting your account will remove your access to your saved deals, contracts, and other account data.</p>
      </LegalSection>

      <LegalSection id="childrens-privacy" title="11. Children's Privacy">
        <p>
          RealOfferAI is not intended for children under 13, and RealOfferAI does not knowingly collect personal information from children under
          13.
        </p>
      </LegalSection>

      <LegalSection id="international-users" title="12. International Users">
        <p>
          RealOfferAI is operated for a U.S.-based audience. Information may be processed in the United States or in other countries where our
          service providers operate. RealOfferAI does not claim compliance with the EU General Data Protection Regulation (GDPR) or other
          non-U.S. privacy frameworks.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="13. Changes to This Privacy Policy">
        <p>
          RealOfferAI may update this Privacy Policy from time to time. The revised effective date will be posted on this page. RealOfferAI does
          not guarantee individual email notice of every change.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="14. Contact">
        <p>Questions about this Privacy Policy can be directed to:</p>
        <p className="text-white">
          RealOfferAI
          <br />
          Email: <SupportEmailLink />
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
