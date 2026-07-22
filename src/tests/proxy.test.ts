import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  })),
}));
vi.mock("@/lib/supabase/env", () => ({
  getSupabaseUrl: () => "https://example.supabase.co",
  getSupabaseAnonKey: () => "test-anon-key",
}));

const originalNodeEnv = process.env.NODE_ENV;

function setNodeEnv(value: string) {
  vi.stubEnv("NODE_ENV", value);
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

beforeEach(() => {
  setNodeEnv(originalNodeEnv ?? "test");
});

describe("proxy — canonical host redirect", () => {
  it("redirects 127.0.0.1 to the equivalent localhost URL in development, preserving path and query", async () => {
    setNodeEnv("development");
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("http://127.0.0.1:3000/dashboard/deals/abc?foo=bar", {
      headers: { host: "127.0.0.1:3000" },
    });

    const response = await proxy(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/dashboard/deals/abc?foo=bar");
  });

  it("does not redirect 127.0.0.1 in production", async () => {
    setNodeEnv("production");
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("http://127.0.0.1:3000/dashboard", {
      headers: { host: "127.0.0.1:3000" },
    });

    const response = await proxy(request);

    expect(response.headers.get("location")).toBeNull();
  });

  it("passes localhost requests through unchanged (no redirect)", async () => {
    setNodeEnv("development");
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/dashboard", {
      headers: { host: "localhost:3000" },
    });

    const response = await proxy(request);

    expect(response.headers.get("location")).toBeNull();
  });

  it("leaves a LAN IP untouched — a second device on the network is not this machine", async () => {
    setNodeEnv("development");
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("http://192.168.0.218:3000/dashboard", {
      headers: { host: "192.168.0.218:3000" },
    });

    const response = await proxy(request);

    expect(response.headers.get("location")).toBeNull();
  });
});
