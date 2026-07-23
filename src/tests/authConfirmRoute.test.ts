import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const verifyOtpMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { verifyOtp: verifyOtpMock } })),
}));

afterEach(() => {
  vi.clearAllMocks();
});

async function callRoute(url: string) {
  const { GET } = await import("@/app/auth/confirm/route");
  return GET(new NextRequest(url));
}

describe("/auth/confirm — password recovery link handling", () => {
  it("verifies a valid recovery token and redirects to the requested next page", async () => {
    verifyOtpMock.mockResolvedValue({ error: null });

    const response = await callRoute("http://localhost:3000/auth/confirm?token_hash=abc123&type=recovery&next=%2Freset-password");

    expect(verifyOtpMock).toHaveBeenCalledWith({ type: "recovery", token_hash: "abc123" });
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/reset-password");
  });

  it("defaults to /reset-password when no next param is given", async () => {
    verifyOtpMock.mockResolvedValue({ error: null });

    const response = await callRoute("http://localhost:3000/auth/confirm?token_hash=abc123&type=recovery");

    expect(response.headers.get("location")).toBe("http://localhost:3000/reset-password");
  });

  it("rejects an unsafe absolute next param (open-redirect attempt) and falls back to /reset-password", async () => {
    verifyOtpMock.mockResolvedValue({ error: null });

    const response = await callRoute(
      "http://localhost:3000/auth/confirm?token_hash=abc123&type=recovery&next=https%3A%2F%2Fevil.example.com",
    );

    expect(response.headers.get("location")).toBe("http://localhost:3000/reset-password");
  });

  it("redirects to reset-password with an error flag when the token is expired or invalid", async () => {
    verifyOtpMock.mockResolvedValue({ error: { message: "Token has expired or is invalid" } });

    const response = await callRoute("http://localhost:3000/auth/confirm?token_hash=bad&type=recovery");

    expect(response.headers.get("location")).toBe("http://localhost:3000/reset-password?error=invalid_link");
  });

  it("redirects to reset-password with an error flag when the link is missing its token entirely", async () => {
    const response = await callRoute("http://localhost:3000/auth/confirm");

    expect(verifyOtpMock).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("http://localhost:3000/reset-password?error=invalid_link");
  });

  it("redirects to reset-password with an error flag when type is missing", async () => {
    const response = await callRoute("http://localhost:3000/auth/confirm?token_hash=abc123");

    expect(verifyOtpMock).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("http://localhost:3000/reset-password?error=invalid_link");
  });
});
