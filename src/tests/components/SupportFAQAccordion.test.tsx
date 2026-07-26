// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SupportFAQAccordion } from "@/components/support/SupportFAQAccordion";

afterEach(() => {
  cleanup();
});

const ALL_QUESTIONS = [
  "What does RealOfferAI do?",
  "Are RealOfferAI estimates guaranteed?",
  "Where does the property information come from?",
  "Can I use RealOfferAI to determine my final offer price?",
  "Can I save properties and return to them later?",
  "Can RealOfferAI generate purchase agreements?",
  "How do I report inaccurate property information?",
  "How do I reset my password?",
  "How do I cancel or manage my subscription?",
  "Does RealOfferAI provide legal, financial, or real estate advice?",
  "How quickly will support respond?",
  "Can I suggest a new feature?",
];

describe("SupportFAQAccordion — content", () => {
  it("renders every required question", () => {
    render(<SupportFAQAccordion />);
    for (const question of ALL_QUESTIONS) {
      expect(screen.getByRole("button", { name: new RegExp(question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) })).toBeInTheDocument();
    }
  });

  it("all answers start collapsed", () => {
    render(<SupportFAQAccordion />);
    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveAttribute("aria-expanded", "false");
    }
  });
});

describe("SupportFAQAccordion — accessibility wiring", () => {
  it("connects each trigger button to its panel via aria-controls / id, and each panel back via aria-labelledby", async () => {
    const user = userEvent.setup();
    render(<SupportFAQAccordion />);

    const trigger = screen.getByRole("button", { name: /What does RealOfferAI do/ });
    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const panelId = trigger.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();

    const panel = screen.getByRole("region", { name: /What does RealOfferAI do/ });
    expect(panel.id).toBe(panelId);
    expect(panel.getAttribute("aria-labelledby")).toBe(trigger.id);
  });

  it("is fully keyboard operable — Enter toggles the focused trigger", async () => {
    const user = userEvent.setup();
    render(<SupportFAQAccordion />);

    const trigger = screen.getByRole("button", { name: /How do I reset my password/ });
    trigger.focus();
    await user.keyboard("{Enter}");

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Forgot Password option/)).toBeInTheDocument();
  });
});

describe("SupportFAQAccordion — single-open behavior", () => {
  it("opens an answer when its question is clicked", async () => {
    const user = userEvent.setup();
    render(<SupportFAQAccordion />);

    await user.click(screen.getByRole("button", { name: /Are RealOfferAI estimates guaranteed/ }));

    expect(screen.getByText(/Property values, repair costs, rent estimates/)).toBeInTheDocument();
  });

  it("closes the previously open answer when a different question is opened", async () => {
    const user = userEvent.setup();
    render(<SupportFAQAccordion />);

    await user.click(screen.getByRole("button", { name: /What does RealOfferAI do/ }));
    expect(screen.getByText(/organizing property information/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Are RealOfferAI estimates guaranteed/ }));

    // AnimatePresence keeps the closing panel mounted through its exit
    // transition, so it doesn't disappear from the DOM synchronously.
    await waitFor(() => expect(screen.queryByText(/organizing property information/)).not.toBeInTheDocument());
    expect(screen.getByText(/Property values, repair costs, rent estimates/)).toBeInTheDocument();
  });

  it("clicking an open question again closes it", async () => {
    const user = userEvent.setup();
    render(<SupportFAQAccordion />);

    const trigger = screen.getByRole("button", { name: /What does RealOfferAI do/ });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});

describe("SupportFAQAccordion — clickable support email in answers", () => {
  it("renders a real mailto: link inside the 'report inaccurate information' answer", async () => {
    const user = userEvent.setup();
    render(<SupportFAQAccordion />);

    await user.click(screen.getByRole("button", { name: /How do I report inaccurate property information/ }));

    expect(screen.getByRole("link", { name: "realoffersupport@gmail.com" })).toHaveAttribute("href", "mailto:realoffersupport@gmail.com");
  });

  it("renders a real mailto: link inside the subscription-management answer", async () => {
    const user = userEvent.setup();
    render(<SupportFAQAccordion />);

    await user.click(screen.getByRole("button", { name: /How do I cancel or manage my subscription/ }));

    expect(screen.getByRole("link", { name: "realoffersupport@gmail.com" })).toHaveAttribute("href", "mailto:realoffersupport@gmail.com");
  });

  it("renders a real mailto: link inside the feature-request answer", async () => {
    const user = userEvent.setup();
    render(<SupportFAQAccordion />);

    await user.click(screen.getByRole("button", { name: /Can I suggest a new feature/ }));

    expect(screen.getByRole("link", { name: "realoffersupport@gmail.com" })).toHaveAttribute("href", "mailto:realoffersupport@gmail.com");
  });
});
