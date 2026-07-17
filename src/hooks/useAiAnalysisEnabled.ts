"use client";

import { useEffect, useState } from "react";
import { isInvestmentAnalystAiEnabled } from "@/lib/investmentAnalysis/service";

/** Whether an AI provider is configured server-side, fetched once on mount.
 * Defaults to false (rule-based only) until the server action resolves —
 * the safer assumption, and the feature works fully either way. */
export function useAiAnalysisEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    isInvestmentAnalystAiEnabled()
      .then(setEnabled)
      .catch(() => setEnabled(false));
  }, []);

  return enabled;
}
