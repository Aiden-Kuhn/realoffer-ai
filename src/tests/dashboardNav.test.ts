import { describe, expect, it } from "vitest";
import { DASHBOARD_NAV_ITEMS } from "@/config/dashboardNav";

describe("DASHBOARD_NAV_ITEMS — sidebar Analyze Deal entry point", () => {
  it("points at the focused /analyze route, not the retired dashboard-embedded one", () => {
    const analyzeItem = DASHBOARD_NAV_ITEMS.find((item) => item.label === "Analyze Deal");
    expect(analyzeItem?.href).toBe("/analyze");
  });

  it("does not leave a stale reference to /dashboard/analyze in the sidebar config", () => {
    expect(DASHBOARD_NAV_ITEMS.some((item) => item.href === "/dashboard/analyze")).toBe(false);
  });
});
