import { describe, expect, it } from "vitest";
import { isAllowedZillowUrl, parseZillowUrl } from "@/lib/property/zillowUrl";

describe("isAllowedZillowUrl", () => {
  it("accepts a well-formed Zillow homedetails URL", () => {
    expect(isAllowedZillowUrl("https://www.zillow.com/homedetails/123-Main-St-City-ST-12345/12345678_zpid/")).toBe(true);
  });

  it("accepts the bare zillow.com host", () => {
    expect(isAllowedZillowUrl("https://zillow.com/homedetails/123-Main-St/12345_zpid/")).toBe(true);
  });

  it("accepts uppercase scheme/host (case-insensitive)", () => {
    expect(isAllowedZillowUrl("HTTPS://WWW.ZILLOW.COM/homedetails/123-Main-St/12345_zpid/")).toBe(true);
  });

  it("rejects javascript: URLs", () => {
    expect(isAllowedZillowUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects a look-alike subdomain", () => {
    expect(isAllowedZillowUrl("https://www.zillow.com.evil.com/homedetails/123-Main-St/12345_zpid/")).toBe(false);
  });

  it("rejects an unrelated domain", () => {
    expect(isAllowedZillowUrl("https://www.redfin.com/homedetails/123-Main-St")).toBe(false);
  });

  it("rejects a malformed URL", () => {
    expect(isAllowedZillowUrl("not a url at all")).toBe(false);
  });

  it("rejects a Zillow URL missing the /homedetails/ path", () => {
    expect(isAllowedZillowUrl("https://www.zillow.com/homes/for_sale/")).toBe(false);
  });

  it("rejects a non-http(s) protocol on an otherwise valid host", () => {
    expect(isAllowedZillowUrl("ftp://www.zillow.com/homedetails/123-Main-St/12345_zpid/")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isAllowedZillowUrl("")).toBe(false);
  });
});

describe("parseZillowUrl", () => {
  it("extracts the address slug and zpid from a well-formed URL", () => {
    const parsed = parseZillowUrl("https://www.zillow.com/homedetails/123-Main-St-City-ST-12345/12345678_zpid/");
    expect(parsed).toEqual({
      addressSlug: "123-Main-St-City-ST-12345",
      zpid: "12345678",
      guessedAddressSlug: "123-Main-St-City-ST-12345",
    });
  });

  it("returns null zpid when the zpid segment is missing", () => {
    const parsed = parseZillowUrl("https://www.zillow.com/homedetails/123-Main-St-City-ST-12345/");
    expect(parsed?.zpid).toBeNull();
    expect(parsed?.addressSlug).toBe("123-Main-St-City-ST-12345");
  });

  it("returns null for a disallowed URL", () => {
    expect(parseZillowUrl("javascript:alert(1)")).toBeNull();
  });

  it("returns null when there is no address slug at all", () => {
    expect(parseZillowUrl("https://www.zillow.com/homedetails/")).toBeNull();
  });
});
