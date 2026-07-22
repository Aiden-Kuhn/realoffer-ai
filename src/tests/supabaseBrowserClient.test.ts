import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => ({ marker: Symbol("supabase-browser-client") })),
}));
vi.mock("@/lib/supabase/env", () => ({
  getSupabaseUrl: () => "https://example.supabase.co",
  getSupabaseAnonKey: () => "test-anon-key",
}));

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("createClient (browser) — singleton", () => {
  it("returns the exact same client instance across multiple calls", async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const first = createClient();
    const second = createClient();
    const third = createClient();

    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it("only constructs the underlying Supabase browser client once, no matter how many callers ask for it", async () => {
    const { createBrowserClient } = await import("@supabase/ssr");
    const { createClient } = await import("@/lib/supabase/client");

    createClient();
    createClient();
    createClient();

    expect(createBrowserClient).toHaveBeenCalledTimes(1);
  });

  it("creates a fresh client per module instance (e.g. a genuine full page reload), not a cross-reload leak", async () => {
    const { createClient: createClientFirstLoad } = await import("@/lib/supabase/client");
    const firstInstance = createClientFirstLoad();

    vi.resetModules();

    const { createClient: createClientSecondLoad } = await import("@/lib/supabase/client");
    const secondInstance = createClientSecondLoad();

    expect(secondInstance).not.toBe(firstInstance);
  });
});
