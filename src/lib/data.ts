import {
  Brain,
  Hammer,
  Calculator,
  FileSignature,
  Repeat,
  Building2,
  Link2,
  ScanSearch,
  FileBarChart,
  ShieldCheck,
  Zap,
  Clock,
  type LucideIcon,
} from "lucide-react";

export const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export type Stat = {
  value: string;
  label: string;
};

export const stats: Stat[] = [
  { value: "$1.4B+", label: "In deals analyzed" },
  { value: "38,000+", label: "Properties evaluated" },
  { value: "9 sec", label: "Average analysis time" },
  { value: "50 states", label: "Market coverage" },
];

export const audiences = [
  "Fix & Flip Investors",
  "Wholesalers",
  "Buy & Hold Landlords",
  "Real Estate Agents",
  "House Flippers",
  "Private Lenders",
];

export type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const features: Feature[] = [
  {
    icon: Brain,
    title: "AI Deal Analysis",
    description:
      "Drop in an address or listing link and get a full investment breakdown in seconds — comps, risk factors, and a clear buy or pass recommendation.",
  },
  {
    icon: Hammer,
    title: "Repair Cost Estimator",
    description:
      "Computer-vision powered condition scoring translates photos and listing details into line-item repair estimates by trade, down to the dollar.",
  },
  {
    icon: Calculator,
    title: "ARV Calculator",
    description:
      "Pulls live, verified comparable sales within your radius and adjusts for square footage, condition, and finishes to project after-repair value.",
  },
  {
    icon: FileSignature,
    title: "Cash Offer Generator",
    description:
      "Generate a defensible maximum allowable offer instantly, backed by your target margin, holding costs, and real-time repair data.",
  },
  {
    icon: Repeat,
    title: "Wholesale Assignment Analysis",
    description:
      "Model assignment fees against end-buyer profit margins automatically, so every contract you send out is one investors will actually take.",
  },
  {
    icon: Building2,
    title: "Rental Investment Calculator",
    description:
      "Instant cap rate, cash-on-cash return, and DSCR projections using live rent comps, taxes, insurance, and financing terms you control.",
  },
];

export type Step = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const steps: Step[] = [
  {
    icon: Link2,
    title: "Paste an address or listing link",
    description:
      "Drop in any property address or a link from Zillow, Redfin, or the MLS. No manual data entry, no spreadsheets.",
  },
  {
    icon: ScanSearch,
    title: "AI analyzes the deal",
    description:
      "Our models pull comps, tax records, permit history, and listing photos to assess condition, market position, and risk in real time.",
  },
  {
    icon: FileBarChart,
    title: "Get instant projections",
    description:
      "Review ARV, repair costs, profit margins, and a suggested offer — all laid out in a clean, shareable report.",
  },
  {
    icon: Zap,
    title: "Make your offer with confidence",
    description:
      "Export the analysis, generate a cash offer, or send it straight to your buyers list — all backed by data, not gut feel.",
  },
];

export type PlanFeature = { label: string; included: boolean };

export type Plan = {
  name: string;
  price: string;
  period: string;
  description: string;
  cta: string;
  featured?: boolean;
  features: PlanFeature[];
};

export const plans: Plan[] = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    description: "For individual investors evaluating a handful of deals a month.",
    cta: "Get Started",
    features: [
      { label: "20 AI deal analyses / month", included: true },
      { label: "ARV & repair cost estimates", included: true },
      { label: "Cash offer generator", included: true },
      { label: "Email support", included: true },
      { label: "Wholesale assignment analysis", included: false },
      { label: "Team seats", included: false },
      { label: "API access", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$149",
    period: "/month",
    description: "For active investors and wholesalers running deals every week.",
    cta: "Get Started",
    featured: true,
    features: [
      { label: "Unlimited AI deal analyses", included: true },
      { label: "ARV & repair cost estimates", included: true },
      { label: "Cash offer generator", included: true },
      { label: "Wholesale assignment analysis", included: true },
      { label: "Rental investment calculator", included: true },
      { label: "Priority support", included: true },
      { label: "5 team seats", included: true },
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For brokerages, funds, and teams that need scale and control.",
    cta: "Contact Sales",
    features: [
      { label: "Everything in Pro", included: true },
      { label: "Unlimited team seats", included: true },
      { label: "Full API access", included: true },
      { label: "Custom underwriting rules", included: true },
      { label: "Dedicated account manager", included: true },
      { label: "SSO & audit logs", included: true },
      { label: "Custom SLA", included: true },
    ],
  },
];

export type FaqItem = { question: string; answer: string };

export const faqs: FaqItem[] = [
  {
    question: "How accurate is the AI deal analysis?",
    answer:
      "RealOffer AI cross-references live MLS data, county tax records, and recent comparable sales to generate its projections. Most users see ARV estimates within 3-5% of a licensed appraiser's valuation, and we continuously retrain our models on closed deal outcomes to improve accuracy over time.",
  },
  {
    question: "Do I need to enter property details manually?",
    answer:
      "No. Paste a property address or a listing link from Zillow, Redfin, or your MLS, and RealOffer AI automatically pulls square footage, bed/bath count, lot size, listing photos, and tax history to build your analysis.",
  },
  {
    question: "Can I use RealOffer AI for wholesaling?",
    answer:
      "Yes. The Wholesale Assignment Analysis tool models your assignment fee against your end buyer's target margin using the same repair and ARV data, so you can confirm a contract is fundable before you ever send it to your buyers list.",
  },
  {
    question: "What markets does RealOffer AI cover?",
    answer:
      "We currently support comparable sales and tax data across all 50 states. Coverage depth varies slightly by county depending on public record availability, but every core valuation feature works nationwide.",
  },
  {
    question: "Is there a contract or can I cancel anytime?",
    answer:
      "All plans are billed monthly with no long-term contract. You can upgrade, downgrade, or cancel your subscription at any time from your account settings, effective at the end of your current billing period.",
  },
  {
    question: "Does RealOffer AI integrate with my existing tools?",
    answer:
      "Pro and Enterprise plans include CSV export and API access, so you can push analyses directly into your CRM, deal tracker, or underwriting spreadsheet. Native integrations with popular investor CRMs are on our near-term roadmap.",
  },
];

export const trustPoints = [
  { icon: ShieldCheck, label: "Bank-level data security" },
  { icon: Clock, label: "Results in under 10 seconds" },
  { icon: Zap, label: "No spreadsheets required" },
];
