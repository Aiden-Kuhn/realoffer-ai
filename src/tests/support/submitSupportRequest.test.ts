// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildSupportMailtoUrl, submitSupportRequest, SUPPORT_EMAIL, type SupportRequestInput } from "@/lib/support/submitSupportRequest";

const baseInput: SupportRequestInput = {
  name: "Jamie Rivera",
  email: "jamie@example.com",
  subject: "Trouble saving a deal",
  category: "Technical Issue",
  message: "The save button doesn't respond on the deal workspace page.",
  submittedAt: "2026-01-15T12:00:00.000Z",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildSupportMailtoUrl", () => {
  it("addresses the mailto link to the correct support inbox", () => {
    const url = buildSupportMailtoUrl(baseInput);
    expect(url.startsWith(`mailto:${SUPPORT_EMAIL}?`)).toBe(true);
  });

  it("includes the subject, prefixed for clarity in the recipient's inbox", () => {
    const url = buildSupportMailtoUrl(baseInput);
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("subject")).toBe("RealOffer AI Support Request: Trouble saving a deal");
  });

  it("includes name, email, category, submission time, and the message in the body", () => {
    const url = buildSupportMailtoUrl(baseInput);
    const params = new URLSearchParams(url.split("?")[1]);
    const body = params.get("body") ?? "";
    expect(body).toContain("Category: Technical Issue");
    expect(body).toContain("Name: Jamie Rivera");
    expect(body).toContain("Email: jamie@example.com");
    expect(body).toContain("Submitted: 2026-01-15T12:00:00.000Z");
    expect(body).toContain("The save button doesn't respond on the deal workspace page.");
  });
});

describe("submitSupportRequest", () => {
  it("opens the user's email client by navigating to the mailto: URL", async () => {
    const fakeLocation = { ...window.location, href: "" };
    vi.stubGlobal("location", fakeLocation);

    const result = await submitSupportRequest(baseInput);

    expect(result.error).toBeNull();
    expect(fakeLocation.href.startsWith(`mailto:${SUPPORT_EMAIL}?`)).toBe(true);
  });

  it("fails cleanly (without navigating) when the message is long enough to produce an unreliable mailto: URL", async () => {
    const fakeLocation = { ...window.location, href: "" };
    vi.stubGlobal("location", fakeLocation);

    const result = await submitSupportRequest({ ...baseInput, message: "x".repeat(2000) });

    expect(result.error).toContain(SUPPORT_EMAIL);
    expect(fakeLocation.href).toBe("");
  });
});
