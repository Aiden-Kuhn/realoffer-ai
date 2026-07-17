"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Target,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
  ListChecks,
  Gauge,
  ChevronDown,
  Info,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Wand2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Handshake,
} from "lucide-react";
import { formatCents, formatPercent } from "@/lib/calculations/money";
import { buildInvestmentAnalysisContext } from "@/lib/investmentAnalysis/buildContext";
import { computeDealScore } from "@/lib/investmentAnalysis/dealScore";
import { computeRecommendation } from "@/lib/investmentAnalysis/recommendation";
import { computeOfferGuidance } from "@/lib/investmentAnalysis/offerGuidance";
import { computeSensitivityAnalysis } from "@/lib/investmentAnalysis/sensitivity";
import { computeAnalysisInputHash } from "@/lib/investmentAnalysis/inputHash";
import { generateInvestmentAnalysis } from "@/lib/investmentAnalysis/service";
import { useAiAnalysisEnabled } from "@/hooks/useAiAnalysisEnabled";
import type { DealScoreLabel } from "@/config/investmentAnalysis";
import type { InvestmentAnalysisResult, CachedAnalysisOrigin, DeterministicRecommendation } from "@/lib/investmentAnalysis/types";
import type { RepairEstimateState } from "@/lib/calculations/repairs";
import type { ComparableSale, PropertyRecord } from "@/lib/property/types";
import type { DealFinancialResults } from "@/lib/calculations/types";
import type { DealAssumptions } from "@/types/deal";

type InvestmentAnalystProps = {
  dealId: string;
  property: PropertyRecord;
  comparables: ComparableSale[];
  repairEstimate: RepairEstimateState;
  assumptions: DealAssumptions;
  results: DealFinancialResults;
  savedAnalysis: InvestmentAnalysisResult | undefined;
  onAnalysisChange: (analysis: InvestmentAnalysisResult) => void;
};

const PROGRESS_STEPS = [
  "Preparing structured deal context",
  "Reviewing margins and assumptions",
  "Evaluating risks and sensitivities",
  "Preparing investment summary",
];
const STEP_INTERVAL_MS = 900;

const SCORE_LABEL_STYLES: Record<DealScoreLabel, { ring: string; text: string; bg: string; hex: string; glow: string }> = {
  strong_candidate: { ring: "border-emerald-400/30", text: "text-emerald-300", bg: "bg-emerald-400/[0.08]", hex: "#34d399", glow: "shadow-[0_0_40px_-16px_rgba(52,211,153,0.5)]" },
  worth_investigating: { ring: "border-accent-3/30", text: "text-accent-3", bg: "bg-accent-3/[0.08]", hex: "#22d3ee", glow: "shadow-[0_0_40px_-16px_rgba(34,211,238,0.5)]" },
  negotiation_required: { ring: "border-amber-400/30", text: "text-amber-300", bg: "bg-amber-400/[0.08]", hex: "#fbbf24", glow: "shadow-[0_0_40px_-16px_rgba(251,191,36,0.5)]" },
  weak_candidate: { ring: "border-orange-400/30", text: "text-orange-300", bg: "bg-orange-400/[0.08]", hex: "#fb923c", glow: "shadow-[0_0_40px_-16px_rgba(251,146,60,0.5)]" },
  does_not_meet_targets: { ring: "border-red-400/30", text: "text-red-300", bg: "bg-red-400/[0.08]", hex: "#f87171", glow: "shadow-[0_0_40px_-16px_rgba(248,113,113,0.5)]" },
};

const RECOMMENDATION_TONE: Record<
  DeterministicRecommendation["recommendation"],
  { icon: typeof CheckCircle2; iconClass: string; accent: string }
> = {
  pursue_at_current_assumptions: { icon: CheckCircle2, iconClass: "text-emerald-400", accent: "bg-emerald-400" },
  pursue_if_negotiated_lower: { icon: Handshake, iconClass: "text-amber-400", accent: "bg-amber-400" },
  verify_repairs_and_comparables: { icon: Info, iconClass: "text-accent-3", accent: "bg-accent-3" },
  insufficient_information: { icon: HelpCircle, iconClass: "text-white/50", accent: "bg-white/30" },
  does_not_meet_targets: { icon: XCircle, iconClass: "text-red-400", accent: "bg-red-400" },
};

export function InvestmentAnalyst({
  dealId,
  property,
  comparables,
  repairEstimate,
  assumptions,
  results,
  savedAnalysis,
  onAnalysisChange,
}: InvestmentAnalystProps) {
  const [analysis, setAnalysis] = useState<InvestmentAnalysisResult | undefined>(savedAnalysis);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepLabel, setStepLabel] = useState(PROGRESS_STEPS[0]);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [devOrigin, setDevOrigin] = useState<CachedAnalysisOrigin | null>(null);
  const aiEnabled = useAiAnalysisEnabled();

  const inFlightRef = useRef(false);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    };
  }, []);

  // Everything below is pure and client-safe (no server-only import), so
  // the deal score, recommendation, offer guidance, and sensitivity
  // scenarios are always live and instant — no AI call, no network
  // round-trip, never blocked on (or by) the narrative generation below.
  const context = useMemo(
    () => buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results),
    [property, comparables, repairEstimate, assumptions, results],
  );
  const dealScore = useMemo(() => computeDealScore(context), [context]);
  const recommendation = useMemo(() => computeRecommendation(context), [context]);
  const offerGuidance = useMemo(() => computeOfferGuidance(context), [context]);
  const sensitivity = useMemo(() => computeSensitivityAnalysis(context), [context]);
  const currentInputHash = useMemo(
    () => computeAnalysisInputHash(property, comparables, repairEstimate, assumptions),
    [property, comparables, repairEstimate, assumptions],
  );

  const isStale = analysis !== undefined && analysis.inputHash !== currentInputHash;

  async function handleGenerate(forceRegenerate: boolean) {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsGenerating(true);
    setGenerationError(null);
    setDevOrigin(null);

    let i = 0;
    setStepLabel(PROGRESS_STEPS[0]);
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    stepTimerRef.current = setInterval(() => {
      i = Math.min(i + 1, PROGRESS_STEPS.length - 1);
      setStepLabel(PROGRESS_STEPS[i]);
    }, STEP_INTERVAL_MS);

    try {
      const { result, origin } = await generateInvestmentAnalysis(
        dealId,
        property,
        comparables,
        repairEstimate,
        assumptions,
        results,
        { forceRegenerate },
      );
      if (!isMountedRef.current) return;
      setAnalysis(result);
      onAnalysisChange(result);
      setDevOrigin(origin);
    } catch {
      if (!isMountedRef.current) return;
      setGenerationError("Something went wrong generating the investment analysis. Please try again.");
    } finally {
      if (stepTimerRef.current) {
        clearInterval(stepTimerRef.current);
        stepTimerRef.current = null;
      }
      if (isMountedRef.current) {
        setIsGenerating(false);
      }
      inFlightRef.current = false;
    }
  }

  const scoreStyle = SCORE_LABEL_STYLES[dealScore.label];
  const scoreDegrees = Math.max(4, Math.round((dealScore.score / 100) * 360));
  const tone = RECOMMENDATION_TONE[recommendation.recommendation];
  const ToneIcon = tone.icon;

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-3/10">
          <Sparkles className="h-3.5 w-3.5 text-accent-3" />
        </span>
        <h2 className="text-sm font-semibold text-white">Investment Analyst</h2>
      </div>
      <p className="text-xs text-muted mb-4 pl-9">
        RealOffer&apos;s interpretation of the deal above — grounded in the calculations already shown, never a
        replacement for them.
      </p>

      {/* Deal score + recommendation: always live, deterministic, never waits on AI. */}
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-3 mb-4">
        <div
          className={`flex sm:w-52 flex-col items-center justify-center gap-2 rounded-2xl border ${scoreStyle.ring} ${scoreStyle.bg} ${scoreStyle.glow} px-6 py-6 text-center transition-shadow duration-300`}
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">RealOffer Deal Score</p>
          <div
            className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
            style={{ background: `conic-gradient(${scoreStyle.hex} ${scoreDegrees}deg, rgba(255,255,255,0.07) ${scoreDegrees}deg)` }}
          >
            <div className="flex h-[92px] w-[92px] flex-col items-center justify-center rounded-full bg-surface">
              <span className={`text-[2.5rem] font-bold leading-none tabular-nums ${scoreStyle.text}`}>{dealScore.score}</span>
              <span className="mt-1 text-[10px] text-muted">/ 100</span>
            </div>
          </div>
          <p className={`text-sm font-semibold ${scoreStyle.text}`}>{dealScore.labelText}</p>
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-1 text-[11px] text-white/40 hover:text-white/70 transition-colors">
              How this was scored
              <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
            </summary>
            <ul className="mt-2.5 flex flex-col gap-1 text-left">
              {dealScore.breakdown.map((item) => (
                <li key={item.component} className="flex items-center justify-between gap-3 text-[11px] text-muted leading-relaxed">
                  <span className="text-white/70">{item.component}</span>
                  <span className="tabular-nums shrink-0">{item.pointsEarned}/{item.pointsPossible}</span>
                </li>
              ))}
            </ul>
          </details>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-2 p-4 pl-5 min-w-0">
          <span className={`absolute left-0 top-0 h-full w-1 ${tone.accent}`} />
          <div className="flex items-start gap-2.5 mb-2">
            <ToneIcon className={`h-4 w-4 shrink-0 mt-0.5 ${tone.iconClass}`} />
            <p className="text-[15px] font-semibold text-white leading-snug">{recommendation.recommendationLabel}</p>
          </div>
          <ul className="flex flex-col gap-1.5 mb-2.5 pl-[26px]">
            {recommendation.reasons.map((reason, i) => (
              <li key={i} className="text-xs text-white/60 leading-relaxed">
                {reason}
              </li>
            ))}
          </ul>
          <details className="group pl-[26px]">
            <summary className="flex cursor-pointer list-none items-center gap-1 text-xs text-white/45 hover:text-white/80 transition-colors">
              What could change this
              <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
            </summary>
            <ul className="mt-2 flex flex-col gap-1">
              {recommendation.whatWouldChangeThis.map((line, i) => (
                <li key={i} className="text-xs text-muted leading-relaxed">
                  {line}
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>

      {/* Offer guidance: always live, tied directly to the deterministic MAO. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 auto-rows-fr gap-2.5 mb-2.5">
        <OfferStat icon={Target} label="Suggested opening offer" value={formatCents(offerGuidance.suggestedOpeningOfferCents)} tone="accent" />
        <OfferStat icon={Gauge} label="Maximum recommended offer" value={formatCents(offerGuidance.maximumRecommendedOfferCents)} tone="neutral" />
        <OfferStat
          icon={offerGuidance.differenceFromListPriceCents !== null && offerGuidance.differenceFromListPriceCents < 0 ? TrendingDown : TrendingUp}
          label="Vs. list price"
          value={offerGuidance.differenceFromListPriceCents !== null ? formatSignedCents(offerGuidance.differenceFromListPriceCents) : "Not available"}
          tone="neutral"
        />
        <OfferStat
          icon={offerGuidance.differenceFromProposedContractCents < 0 ? TrendingDown : TrendingUp}
          label="Vs. proposed contract"
          value={formatSignedCents(offerGuidance.differenceFromProposedContractCents)}
          tone={offerGuidance.differenceFromProposedContractCents < 0 ? "negative" : "positive"}
        />
      </div>
      <p className="text-[11px] text-muted leading-relaxed mb-4">
        Suggested opening offer is {formatPercent(offerGuidance.discountBelowMaxUsed)} below the maximum recommended
        offer — a configurable starting point, not a prediction of what a seller will accept. You control all offers
        and negotiations.
      </p>

      {/* Sensitivity: always live, every scenario run through the same deterministic engine. */}
      <details className="group mb-4" open>
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3 transition-colors duration-150 hover:border-border-strong">
          <span className="text-sm font-medium text-white">Sensitivity scenarios</span>
          <ChevronDown className="h-4 w-4 text-white/40 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-2.5 overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="py-2 pr-3 font-medium">Scenario</th>
                <th className="py-2 pr-3 font-medium">Profit</th>
                <th className="py-2 pr-3 font-medium">MAO</th>
                <th className="py-2 pr-3 font-medium">Cushion</th>
                <th className="py-2 pr-3 font-medium">Return on cost</th>
                <th className="py-2 pr-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {sensitivity.scenarios.map((s) => (
                <tr
                  key={s.key}
                  className={`border-b border-border/60 last:border-0 transition-colors duration-150 hover:bg-white/[0.025] ${
                    s.key === "base" ? "bg-accent-3/[0.04]" : ""
                  }`}
                >
                  <td className="py-2.5 pr-3 text-white/80 whitespace-nowrap" title={s.description}>
                    {s.key === "base" ? <span className="text-accent-3">●</span> : null} {s.label}
                  </td>
                  <td className={`py-2.5 pr-3 tabular-nums whitespace-nowrap font-medium ${s.projectedInvestorProfitCents < 0 ? "text-red-400" : "text-white"}`}>
                    {formatCents(s.projectedInvestorProfitCents)}
                  </td>
                  <td className="py-2.5 pr-3 text-white/70 tabular-nums whitespace-nowrap">{formatCents(s.maximumAllowableOfferCents)}</td>
                  <td className={`py-2.5 pr-3 tabular-nums whitespace-nowrap ${s.remainingBuyerCushionCents < 0 ? "text-red-400" : "text-white/70"}`}>
                    {formatCents(s.remainingBuyerCushionCents)}
                  </td>
                  <td className="py-2.5 pr-3 text-white/70 tabular-nums whitespace-nowrap">{formatPercent(s.investorReturnOnCost)}</td>
                  <td className={`py-2.5 pr-3 whitespace-nowrap ${classificationTextClass(s.dealClassification)}`}>{s.dealClassification}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <div className="h-px bg-border mb-4" />

      {/* Narrative: AI-enhanced or rule-based explanation. Requires an explicit click — never generated automatically. */}
      <div className="rounded-xl border border-accent-3/20 bg-accent-3/[0.03] p-5 shadow-elevated">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-accent-3" />
            <h3 className="text-sm font-semibold text-white">Explanation</h3>
            {analysis ? (
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide ${
                  analysis.source === "ai" ? "border-accent-3/25 bg-accent-3/10 text-accent-3" : "border-white/15 bg-white/[0.06] text-white/60"
                }`}
              >
                {analysis.source === "ai" ? "AI-enhanced" : "RealOffer rule-based analysis"}
              </span>
            ) : null}
            {process.env.NODE_ENV !== "production" && devOrigin ? (
              <span className="rounded-full border border-dashed border-white/15 px-2 py-0.5 text-[10px] text-white/35">dev: {devOrigin}</span>
            ) : null}
          </div>
          {analysis && !isGenerating ? (
            <button
              type="button"
              onClick={() => handleGenerate(true)}
              className="inline-flex items-center gap-1.5 h-8 rounded-full border border-border px-3 text-xs font-medium text-white/70 hover:text-white hover:border-border-strong active:scale-[0.98] transition-all duration-150"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate Analysis
            </button>
          ) : null}
        </div>

        {isStale && !isGenerating ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-400/25 bg-amber-400/10 px-3.5 py-3 text-xs text-amber-100 mb-4">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-300" />
            This explanation was generated with different assumptions than what&apos;s shown above. The numbers
            above are current; regenerate to refresh the explanation.
          </div>
        ) : null}

        {generationError ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-400/25 bg-red-400/10 px-3.5 py-3 text-xs text-red-300 mb-4">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            {generationError}
          </div>
        ) : null}

        {isGenerating ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-4 text-sm text-white/80">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent-3" />
            {stepLabel}
          </div>
        ) : analysis ? (
          <NarrativeView analysis={analysis} aiEnabled={aiEnabled} />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-4 py-8 text-center">
            <p className="text-sm text-white/70 max-w-sm">
              Generate a written summary, strengths, risks, and next steps from the numbers above.
            </p>
            <p className="text-xs text-muted max-w-sm">
              {aiEnabled
                ? "Uses your configured AI provider, with RealOffer's rule-based analyst as an automatic fallback."
                : "No AI provider is configured — this uses RealOffer's built-in rule-based analyst, which works fully offline."}
            </p>
            <button
              type="button"
              onClick={() => handleGenerate(false)}
              className="inline-flex items-center gap-2 h-10 rounded-full bg-white px-4 text-sm font-medium text-black hover:bg-white/90 active:scale-[0.98] transition-all duration-150"
            >
              <Sparkles className="h-4 w-4" />
              Generate Analysis
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-border bg-surface-2 px-4 py-3.5 text-xs leading-relaxed text-muted">
        <Info className="h-3.5 w-3.5 text-white/40 mt-0.5 shrink-0" />
        RealOffer AI provides estimates, calculations, and AI-assisted interpretations for informational purposes.
        It is not an appraisal, inspection, legal opinion, financial advice, lending decision, brokerage
        recommendation, or guarantee of value, condition, profit, seller acceptance, or closing.
      </div>
    </section>
  );
}

function formatSignedCents(cents: number): string {
  const formatted = formatCents(Math.abs(cents));
  return cents < 0 ? `-${formatted}` : `+${formatted}`;
}

function classificationTextClass(label: string): string {
  if (label.includes("Strong") || label.includes("Potential")) return "text-emerald-400";
  if (label.includes("Thin")) return "text-amber-400";
  if (label.includes("Does Not Meet")) return "text-red-400/80";
  return "text-white/50";
}

type OfferStatTone = "neutral" | "accent" | "positive" | "negative";
const OFFER_STAT_STYLES: Record<OfferStatTone, string> = {
  neutral: "border-border bg-surface-2",
  accent: "border-accent-3/25 bg-accent-3/[0.07]",
  positive: "border-emerald-400/25 bg-emerald-400/[0.07]",
  negative: "border-red-400/25 bg-red-400/[0.07]",
};

function OfferStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  tone: OfferStatTone;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col justify-between rounded-xl border ${OFFER_STAT_STYLES[tone]} p-3.5 transition-colors duration-150 hover:border-border-strong`}
    >
      <div className="flex items-center gap-1.5 text-muted">
        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
        <span className="text-[11px] leading-tight">{label}</span>
      </div>
      <p className="mt-2 truncate text-base sm:text-lg font-semibold text-white tabular-nums">{value}</p>
    </div>
  );
}

function NarrativeView({ analysis, aiEnabled }: { analysis: InvestmentAnalysisResult; aiEnabled: boolean }) {
  const { narrative } = analysis;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-white/80 leading-relaxed">{narrative.executiveSummary}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NarrativeList icon={ShieldCheck} iconClass="text-emerald-400" title="Strengths" items={narrative.strengths} />
        <NarrativeList icon={ShieldAlert} iconClass="text-red-400" title="Risks" items={narrative.risks} />
      </div>

      {narrative.missingInformation.length > 0 ? (
        <NarrativeList icon={Info} iconClass="text-accent-3" title="Missing or uncertain information" items={narrative.missingInformation} />
      ) : null}

      <details className="group rounded-lg border border-border bg-surface px-4 py-3">
        <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium text-white/70 hover:text-white transition-colors">
          Price, repair, ARV, and comparable analysis
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
        </summary>
        <dl className="mt-3 flex flex-col gap-3">
          <NarrativeParagraph term="Price" text={narrative.priceAnalysis} />
          <NarrativeParagraph term="Repairs" text={narrative.repairAnalysis} />
          <NarrativeParagraph term="ARV" text={narrative.arvAnalysis} />
          <NarrativeParagraph term="Comparables" text={narrative.comparableAnalysis} />
        </dl>
      </details>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NarrativeList icon={ListChecks} iconClass="text-accent-3" title="Negotiation considerations" items={narrative.negotiationPoints} />
        <NarrativeList icon={ListChecks} iconClass="text-accent-3" title="Recommended next steps" items={narrative.nextSteps} />
      </div>

      {narrative.warnings.length > 0 ? (
        <div className="flex flex-col gap-1.5 rounded-lg border border-amber-400/20 bg-amber-400/[0.05] px-3.5 py-3">
          {narrative.warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-100/90 leading-relaxed flex gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-300" />
              {w}
            </p>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted pt-1">
        <span>
          Explanation confidence: <span className="text-white/70">{narrative.confidence}</span>
          {narrative.confidenceReasons.length > 0 ? ` — ${narrative.confidenceReasons.join(" ")}` : ""}
        </span>
        <span>
          Generated {new Date(analysis.generatedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
          {analysis.source === "ai" && analysis.provider ? ` · ${analysis.provider}` : !aiEnabled ? " · no AI provider configured" : ""}
        </span>
      </div>
    </div>
  );
}

function NarrativeList({
  icon: Icon,
  iconClass,
  title,
  items,
}: {
  icon: typeof ShieldCheck;
  iconClass: string;
  title: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3.5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-white/80 mb-2">
        <Icon className={`h-3.5 w-3.5 ${iconClass}`} />
        {title}
      </p>
      <ul className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-muted leading-relaxed flex gap-2">
            <span className="text-white/20">—</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NarrativeParagraph({ term, text }: { term: string; text: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted mb-0.5">{term}</dt>
      <dd className="text-xs text-white/70 leading-relaxed">{text}</dd>
    </div>
  );
}
