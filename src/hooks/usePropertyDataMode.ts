"use client";

import { useEffect, useState } from "react";
import { getCurrentPropertyDataMode } from "@/lib/property/providerSelection";

/** The configured property-data mode, fetched once on mount. Defaults to
 * "demo" until the server action resolves — matches the actual default. */
export function usePropertyDataMode(): "rentcast" | "demo" {
  const [mode, setMode] = useState<"rentcast" | "demo">("demo");

  useEffect(() => {
    getCurrentPropertyDataMode()
      .then(setMode)
      .catch(() => setMode("demo"));
  }, []);

  return mode;
}
