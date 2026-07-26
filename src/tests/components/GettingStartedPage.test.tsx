// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { GettingStartedPage } from "@/components/help/GettingStartedPage";

// jsdom has no IntersectionObserver implementation. framer-motion's
// whileInView (used by the SectionHeading/Reveal/StaggerGroup primitives
// this page reuses from the marketing site) calls it on mount, so the tree
// crashes without a stub. Scoped to this file only — an earlier attempt to
// add this globally in the shared test setup file altered fake-timer
// behavior in an unrelated suite (AuthConfirmClient's bounded-wait tests).
beforeAll(() => {
  if (typeof globalThis.IntersectionObserver === "undefined") {
    class IntersectionObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    // @ts-expect-error - test-only stub, not a spec-complete implementation
    globalThis.IntersectionObserver = IntersectionObserverStub;
  }
});

afterEach(() => {
  cleanup();
});

describe("GettingStartedPage", () => {
  it("renders the back-to-dashboard link at the top", () => {
    render(<GettingStartedPage />);
    expect(screen.getByRole("link", { name: /back to dashboard/i })).toHaveAttribute("href", "/dashboard");
  });

  it("renders the three required action buttons pointing at the right routes", () => {
    render(<GettingStartedPage />);
    expect(screen.getByRole("link", { name: /analyze a property/i })).toHaveAttribute("href", "/analyze");
    expect(screen.getByRole("link", { name: /view saved deals/i })).toHaveAttribute("href", "/dashboard/deals");
    expect(screen.getByRole("link", { name: /contact support/i })).toHaveAttribute("href", "/contact");
  });

  it("explains the core concepts required by the spec", () => {
    render(<GettingStartedPage />);
    expect(screen.getByText(/ARV \(After-Repair Value\)/)).toBeInTheDocument();
    expect(screen.getByText(/Repair estimate/)).toBeInTheDocument();
    expect(screen.getByText(/MAO \(Maximum Allowable Offer\)/)).toBeInTheDocument();
    expect(screen.getByText(/Deal Score/)).toBeInTheDocument();
    expect(screen.getAllByText(/Risks/).length).toBeGreaterThan(0);
  });

  it("explains saving deals and contracts, each linking to the right dashboard page", () => {
    render(<GettingStartedPage />);
    expect(screen.getByRole("heading", { name: /saving deals/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /generating and managing contracts/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Saved Deals" })).toHaveAttribute("href", "/dashboard/deals");
    expect(screen.getByRole("link", { name: "Contracts" })).toHaveAttribute("href", "/dashboard/contracts");
  });

  it("tells users to independently verify estimates", () => {
    render(<GettingStartedPage />);
    expect(screen.getByText(/Estimates aren't guarantees/)).toBeInTheDocument();
    expect(screen.getByText(/independently verify property details/)).toBeInTheDocument();
  });

  it("links to Contact & Support and shows the support email", () => {
    render(<GettingStartedPage />);
    expect(screen.getByRole("link", { name: "realoffersupport@gmail.com" })).toHaveAttribute(
      "href",
      "mailto:realoffersupport@gmail.com",
    );
  });
});
