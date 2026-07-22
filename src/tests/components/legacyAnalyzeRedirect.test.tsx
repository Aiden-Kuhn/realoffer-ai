import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

afterEach(() => vi.clearAllMocks());

describe("/dashboard/analyze — legacy route", () => {
  it("redirects to the new focused /analyze route for backward compatibility", async () => {
    const { redirect } = await import("next/navigation");
    const LegacyAnalyzePage = (await import("@/app/dashboard/analyze/page")).default;

    LegacyAnalyzePage();

    expect(redirect).toHaveBeenCalledWith("/analyze");
  });
});
