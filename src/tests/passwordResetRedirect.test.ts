import { afterEach, describe, expect, it, vi } from "vitest";
import { getPasswordResetRedirectUrl } from "@/lib/auth/passwordResetRedirect";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getPasswordResetRedirectUrl", () => {
  it("returns the production URL when NODE_ENV is production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(getPasswordResetRedirectUrl()).toBe("https://realoffer-ai.vercel.app/reset-password");
  });

  it("returns the localhost URL when NODE_ENV is development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(getPasswordResetRedirectUrl()).toBe("http://localhost:3000/reset-password");
  });

  it("returns the localhost URL for any other NODE_ENV (e.g. test), never silently falling back to production", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(getPasswordResetRedirectUrl()).toBe("http://localhost:3000/reset-password");
  });
});
