import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalFetch = global.fetch;
const originalEnv = { ...process.env };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function importFreshClient() {
  vi.resetModules();
  return import("@/lib/property/rentcast/client");
}

describe("RentCast client", () => {
  beforeEach(() => {
    process.env.RENTCAST_API_KEY = "test-key-123";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("throws missing_api_key when no key is configured, without making a request", async () => {
    delete process.env.RENTCAST_API_KEY;
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const { fetchPropertyRecords } = await importFreshClient();
    await expect(fetchPropertyRecords("1 Main St, Austin, TX 78701")).rejects.toMatchObject({ code: "missing_api_key" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sends the API key via the X-Api-Key header and never in a query param", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse([]));
    global.fetch = fetchSpy as unknown as typeof fetch;

    const { fetchPropertyRecords } = await importFreshClient();
    await fetchPropertyRecords("1 Main St, Austin, TX 78701");

    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).not.toContain("test-key-123");
    expect((init as RequestInit).headers).toMatchObject({ "X-Api-Key": "test-key-123" });
  });

  it("only ever calls the hardcoded RentCast base URL", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse([]));
    global.fetch = fetchSpy as unknown as typeof fetch;

    const { fetchPropertyRecords } = await importFreshClient();
    await fetchPropertyRecords("1 Main St, Austin, TX 78701");

    const [url] = fetchSpy.mock.calls[0];
    expect(String(url).startsWith("https://api.rentcast.io/v1/properties")).toBe(true);
  });

  it("classifies a 401 response as invalid_api_key", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ message: "unauthorized" }, 401)) as unknown as typeof fetch;
    const { fetchPropertyRecords } = await importFreshClient();
    await expect(fetchPropertyRecords("x")).rejects.toMatchObject({ code: "invalid_api_key" });
  });

  it("classifies a 429 response as rate_limited", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({}, 429)) as unknown as typeof fetch;
    const { fetchPropertyRecords } = await importFreshClient();
    await expect(fetchPropertyRecords("x")).rejects.toMatchObject({ code: "rate_limited" });
  });

  it("classifies a network failure (fetch throws) as network_error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("fetch failed")) as unknown as typeof fetch;
    const { fetchPropertyRecords } = await importFreshClient();
    await expect(fetchPropertyRecords("x")).rejects.toMatchObject({ code: "network_error" });
  });

  it("classifies an AbortError as timeout", async () => {
    const abortError = new DOMException("The operation was aborted", "AbortError");
    global.fetch = vi.fn().mockRejectedValue(abortError) as unknown as typeof fetch;
    const { fetchPropertyRecords } = await importFreshClient();
    await expect(fetchPropertyRecords("x")).rejects.toMatchObject({ code: "timeout" });
  });

  it("classifies unparseable JSON as malformed_response", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response("not json", { status: 200 })) as unknown as typeof fetch;
    const { fetchPropertyRecords } = await importFreshClient();
    await expect(fetchPropertyRecords("x")).rejects.toMatchObject({ code: "malformed_response" });
  });

  it("never surfaces the API key in a thrown error message", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({}, 500)) as unknown as typeof fetch;
    const { fetchPropertyRecords } = await importFreshClient();
    try {
      await fetchPropertyRecords("x");
      throw new Error("expected fetchPropertyRecords to reject");
    } catch (err) {
      expect(String((err as Error).message)).not.toContain("test-key-123");
    }
  });

  it("treats a 404 from the sale-listings endpoint as zero listings, not an error", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({}, 404)) as unknown as typeof fetch;
    const { fetchActiveSaleListings } = await importFreshClient();
    await expect(fetchActiveSaleListings("x")).resolves.toEqual([]);
  });

  it("filters out non-Active listings even if the provider returns them despite the status=Active query param", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      jsonResponse([
        { id: "1", formattedAddress: "1 Main St", status: "Inactive", price: 205000 },
        { id: "2", formattedAddress: "2 Main St", status: "Active", price: 210000 },
      ]),
    ) as unknown as typeof fetch;
    const { fetchActiveSaleListings } = await importFreshClient();
    const result = await fetchActiveSaleListings("x");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("treats a 404 from the value-estimate endpoint as null, not an error", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({}, 404)) as unknown as typeof fetch;
    const { fetchValueEstimate } = await importFreshClient();
    await expect(fetchValueEstimate("x")).resolves.toBeNull();
  });

  it("wraps a bare object property response in an array", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ id: "1", formattedAddress: "1 Main St" })) as unknown as typeof fetch;
    const { fetchPropertyRecords } = await importFreshClient();
    const result = await fetchPropertyRecords("x");
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
  });
});
