// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

const initMock = vi.fn();

vi.mock("@microsoft/clarity", () => ({
  default: { init: (...args: unknown[]) => initMock(...args) },
}));

const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", originalNodeEnv ?? "test");
});

describe("ClarityAnalytics", () => {
  it("does not initialize Clarity outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules();
    const { ClarityAnalytics } = await import("@/components/analytics/ClarityAnalytics");

    render(<ClarityAnalytics />);

    expect(initMock).not.toHaveBeenCalled();
  });

  it("initializes Clarity with the project ID in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const { ClarityAnalytics } = await import("@/components/analytics/ClarityAnalytics");

    render(<ClarityAnalytics />);

    expect(initMock).toHaveBeenCalledTimes(1);
    expect(initMock).toHaveBeenCalledWith("xtfev7yt8z");
  });

  it("never calls Clarity.init more than once, even if the component mounts again", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const { ClarityAnalytics } = await import("@/components/analytics/ClarityAnalytics");

    const { unmount } = render(<ClarityAnalytics />);
    unmount();
    render(<ClarityAnalytics />);

    expect(initMock).toHaveBeenCalledTimes(1);
  });

  it("renders nothing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const { ClarityAnalytics } = await import("@/components/analytics/ClarityAnalytics");

    const { container } = render(<ClarityAnalytics />);

    expect(container).toBeEmptyDOMElement();
  });
});
