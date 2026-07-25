import { afterEach, describe, expect, it, vi } from "vitest";
import { getEmailConfirmRedirectUrl } from "@/lib/auth/emailConfirmRedirect";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getEmailConfirmRedirectUrl", () => {
  it("returns the production URL when NODE_ENV is production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(getEmailConfirmRedirectUrl()).toBe("https://realoffer-ai.vercel.app/auth/confirm");
  });

  it("returns the localhost URL when NODE_ENV is development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(getEmailConfirmRedirectUrl()).toBe("http://localhost:3000/auth/confirm");
  });

  it("returns the localhost URL for any other NODE_ENV (e.g. test), never silently falling back to production", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(getEmailConfirmRedirectUrl()).toBe("http://localhost:3000/auth/confirm");
  });
});
