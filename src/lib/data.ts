import {
  Brain,
  Hammer,
  Calculator,
  FileSignature,
  Repeat,
  LayoutDashboard,
  Link2,
  ScanSearch,
  FileBarChart,
  ShieldCheck,
  Zap,
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

// Product facts, not usage/traction metrics — RealOffer AI is in private
// beta and doesn't have real customer data to report yet.
export const stats: Stat[] = [
  { value: "6", label: "Deal-analysis tools in one workspace" },
  { value: "2", label: "MAO calculation methods to choose from" },
  { value: "100%", label: "Of assumptions stay yours to edit" },
  { value: "Beta", label: "Now in private beta" },
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
      "Drop in an address or listing link and get a full investment breakdown in seconds — comparable sales, risk flags, and a clear deal classification to guide your next move.",
  },
  {
    icon: Hammer,
    title: "Repair Cost Estimator",
    description:
      "Choose a condition preset or build a line-item budget by trade — per-square-foot, category-by-category, or a manual total — and see it flow straight into your deal math.",
  },
  {
    icon: Calculator,
    title: "ARV Calculator",
    description:
      "Pulls comparable sales for the property and lets you include or exclude each one to shape a suggested after-repair value — never a black box, always adjustable.",
  },
  {
    icon: FileSignature,
    title: "Cash Offer Generator",
    description:
      "Generate a maximum allowable offer instantly from your target margin, holding costs, and repair estimate — recalculated the moment you change an assumption.",
  },
  {
    icon: Repeat,
    title: "Wholesale Assignment Analysis",
    description:
      "Model your assignment fee against the end buyer's purchase price and remaining cushion, using the same repair and ARV data as the rest of the analysis.",
  },
  {
    icon: LayoutDashboard,
    title: "Saved Deal Pipeline",
    description:
      "Save every analysis, track status from draft to closed, and search, filter, or sort your pipeline by ARV, assignment fee, or projected profit.",
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
      "Drop in a Zillow listing link, or enter the property manually if you don't have one. No spreadsheets required.",
  },
  {
    icon: ScanSearch,
    title: "AI analyzes the deal",
    description:
      "RealOffer looks up the property record, active listing, valuation, and comparable sales, then flags risks like thin margins or missing data.",
  },
  {
    icon: FileBarChart,
    title: "Get instant projections",
    description:
      "Review ARV, repair costs, profit margins, and a suggested maximum offer — all laid out in one workspace you can adjust in real time.",
  },
  {
    icon: Zap,
    title: "Make your offer with confidence",
    description:
      "Save the analysis to your pipeline and use the maximum allowable offer as your ceiling when you negotiate — backed by data, not gut feel.",
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
      { label: "Saved deal pipeline", included: true },
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
      "RealOffer AI pulls property records, active listings, and comparable sales through RentCast, then calculates a suggested after-repair value from the comps you choose to include. Every figure is an estimate for planning purposes — not an appraisal, inspection, or guarantee of profit — and you can override the ARV or exclude any comp that doesn't fit.",
  },
  {
    question: "Do I need to enter property details manually?",
    answer:
      "Not if you don't want to. Paste a Zillow listing link and RealOffer AI pulls square footage, bed/bath count, lot size, and tax history automatically. You can also enter every field manually — useful for off-market or pocket-listing deals a link can't cover.",
  },
  {
    question: "Can I use RealOffer AI for wholesaling?",
    answer:
      "Yes. Every analysis calculates your assignment fee against the end buyer's purchase price and remaining cushion below the maximum allowable offer, using the same repair and ARV data — so you can gut-check whether a contract is fundable before you sign it.",
  },
  {
    question: "What markets does RealOffer AI cover?",
    answer:
      "Property and comparable-sales data is powered by RentCast, which covers property records across the U.S., though depth of coverage can vary by county depending on public record availability. If a property can't be found automatically, you can enter it manually and continue the analysis.",
  },
  {
    question: "Is there a contract or can I cancel anytime?",
    answer:
      "All plans are billed monthly with no long-term contract. You can upgrade, downgrade, or cancel your subscription at any time from your account settings, effective at the end of your current billing period.",
  },
  {
    question: "Does RealOffer AI integrate with my existing tools?",
    answer:
      "Pro and Enterprise plans are planned to include CSV export and API access, so you can push analyses directly into your CRM, deal tracker, or underwriting spreadsheet. Native integrations with popular investor CRMs are on our near-term roadmap.",
  },
];

export const trustPoints = [
  { icon: ShieldCheck, label: "Your data stays in your browser in demo mode" },
  { icon: Zap, label: "Instant, transparent calculations" },
  { icon: Calculator, label: "No spreadsheets required" },
];
