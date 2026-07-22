import { describe, expect, it } from "vitest";
import { resolveSafeRedirect } from "@/lib/auth/redirectTarget";

describe("resolveSafeRedirect", () => {
  it("returns the default when no redirect target is given", () => {
    expect(resolveSafeRedirect(null)).toBe("/dashboard");
    expect(resolveSafeRedirect(undefined)).toBe("/dashboard");
    expect(resolveSafeRedirect("")).toBe("/dashboard");
  });

  it("allows a same-origin relative path", () => {
    expect(resolveSafeRedirect("/analyze")).toBe("/analyze");
    expect(resolveSafeRedirect("/dashboard/deals/abc-123")).toBe("/dashboard/deals/abc-123");
  });

  it("respects a custom fallback", () => {
    expect(resolveSafeRedirect(null, "/analyze")).toBe("/analyze");
  });

  it("rejects an absolute URL (open-redirect attempt)", () => {
    expect(resolveSafeRedirect("https://evil.example.com")).toBe("/dashboard");
    expect(resolveSafeRedirect("http://evil.example.com/phish")).toBe("/dashboard");
  });

  it("rejects a protocol-relative URL (open-redirect attempt)", () => {
    expect(resolveSafeRedirect("//evil.example.com")).toBe("/dashboard");
  });

  it("rejects a value that doesn't start with a slash", () => {
    expect(resolveSafeRedirect("evil.example.com")).toBe("/dashboard");
    expect(resolveSafeRedirect("javascript:alert(1)")).toBe("/dashboard");
  });

  it("rejects a value containing a scheme anywhere in the string", () => {
    expect(resolveSafeRedirect("/redirect?next=https://evil.example.com")).toBe("/dashboard");
  });
});
