// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Disclaimers } from "@/components/shared/Disclaimers";

afterEach(() => {
  cleanup();
});

describe("Disclaimers", () => {
  it("defaults to the simulated-demo-data disclaimer when isLiveData is not passed", () => {
    render(<Disclaimers />);
    expect(screen.getByText(/simulated demo data/)).toBeInTheDocument();
    expect(screen.queryByText(/retrieved from RentCast/)).not.toBeInTheDocument();
  });

  it("shows the RentCast disclaimer instead of a false 'simulated' claim when isLiveData is true", () => {
    render(<Disclaimers isLiveData />);
    expect(screen.getByText(/retrieved from RentCast/)).toBeInTheDocument();
    expect(screen.queryByText(/simulated demo data/)).not.toBeInTheDocument();
    // Regression guard: production once showed this false claim on every
    // deal, including deals built from real RentCast data.
    expect(screen.queryByText(/All property data is simulated/)).not.toBeInTheDocument();
  });

  it("still shows the simulated-demo disclaimer when isLiveData is explicitly false", () => {
    render(<Disclaimers isLiveData={false} />);
    expect(screen.getByText(/simulated demo data/)).toBeInTheDocument();
  });
});
