// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { TopBar } from "@/components/dashboard/TopBar";

vi.mock("@/components/dashboard/PageHeaderContext", () => ({
  usePageHeader: () => ({ title: "Overview", breadcrumbs: undefined }),
}));

afterEach(() => cleanup());

describe("TopBar — Analyze New Deal entry point", () => {
  it("both the desktop and mobile 'Analyze New Deal' links point at the focused /analyze route", () => {
    render(<TopBar onOpenMobileNav={vi.fn()} />);
    const links = screen.getAllByRole("link", { name: /Analyze [Nn]ew [Dd]eal/ });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/analyze");
    }
  });
});
