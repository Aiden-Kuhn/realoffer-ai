"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

const CLARITY_PROJECT_ID = "xtfev7yt8z";

let clarityInitialized = false;

/**
 * Loads Microsoft Clarity. Renders nothing — all it does is call
 * Clarity.init() from an effect, which only ever runs in the browser after
 * mount, so this has no SSR output and can't affect server rendering.
 *
 * - Production-only: process.env.NODE_ENV is inlined at build time, so this
 *   branch (and Clarity.init itself) is dead-code-eliminated from
 *   non-production builds entirely, not just skipped at runtime.
 * - Duplicate-init-proof: guarded by a module-level flag in addition to
 *   Clarity's own injectScript(), which already no-ops if its script tag
 *   is already in the DOM — belt and suspenders, since this component
 *   could in principle mount more than once.
 * - No performance impact: Clarity.init() only inserts a single async
 *   <script> tag (see @microsoft/clarity's own source); it never blocks
 *   rendering or hydration.
 */
export function ClarityAnalytics() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (clarityInitialized) return;
    clarityInitialized = true;
    Clarity.init(CLARITY_PROJECT_ID);
  }, []);

  return null;
}
