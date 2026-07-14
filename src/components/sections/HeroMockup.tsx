"use client";

import { motion } from "framer-motion";
import { MapPin, TrendingUp, Hammer, DollarSign, Sparkles, ArrowUpRight } from "lucide-react";

const metrics = [
  {
    icon: TrendingUp,
    label: "After Repair Value",
    value: "$412,000",
    accent: "text-accent-3",
  },
  {
    icon: Hammer,
    label: "Repair Estimate",
    value: "$38,500",
    accent: "text-amber-400",
  },
  {
    icon: DollarSign,
    label: "Projected Profit",
    value: "$61,200",
    accent: "text-emerald-400",
  },
];

export function HeroMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="relative mx-auto w-full max-w-3xl"
    >
      <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-br from-accent/40 via-accent-2/20 to-transparent blur-2xl opacity-60" />
      <div className="relative rounded-[24px] glass-strong border border-border-strong shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>
          <div className="ml-3 flex-1 flex items-center gap-2 rounded-md bg-white/[0.04] border border-border px-3 py-1.5 text-xs text-white/40">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">app.realoffer.ai/analyze/428-maple-ridge-dr-austin-tx</span>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-muted mb-1.5">Deal Analysis</p>
              <h3 className="text-lg sm:text-xl font-semibold text-white">
                428 Maple Ridge Dr, Austin, TX
              </h3>
              <p className="text-sm text-muted mt-1">3 bed · 2 bath · 1,840 sqft · Built 1998</p>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-3 py-1">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">8.7 / 10</span>
              </div>
              <span className="text-[11px] text-muted mt-1">AI Deal Score</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {metrics.map((metric, i) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + i * 0.12 }}
                className="rounded-xl bg-white/[0.03] border border-border p-4"
              >
                <metric.icon className={`h-4 w-4 mb-3 ${metric.accent}`} />
                <p className="text-lg font-semibold text-white tabular-nums">{metric.value}</p>
                <p className="text-xs text-muted mt-0.5">{metric.label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="mt-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-accent/10 to-accent-2/10 border border-accent/20 px-4 py-3"
          >
            <span className="text-sm text-white/80">Suggested max offer</span>
            <span className="flex items-center gap-1 text-sm font-semibold text-white">
              $256,400
              <ArrowUpRight className="h-3.5 w-3.5 text-accent-3" />
            </span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
