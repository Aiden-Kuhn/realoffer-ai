// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const getUserMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: getUserMock } })),
}));
// Stubbed so this test only exercises the server-side auth check and prop
// pass-through, not ContactSupportPage's own (separately tested) UI.
vi.mock("@/components/support/ContactSupportPage", () => ({
  ContactSupportPage: (props: { isAuthenticated: boolean; userEmail: string; userFullName: string }) => (
    <div data-testid="contact-support-page">{JSON.stringify(props)}</div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("/contact — server-side auth awareness", () => {
  it("passes isAuthenticated: false and empty prefill for a logged-out visitor", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const ContactPage = (await import("@/app/contact/page")).default;

    render(await ContactPage());

    const props = JSON.parse(screen.getByTestId("contact-support-page").textContent ?? "{}");
    expect(props).toEqual({ isAuthenticated: false, userEmail: "", userFullName: "" });
  });

  it("passes isAuthenticated: true and prefills email/name for a signed-in visitor", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1", email: "jamie@example.com", user_metadata: { full_name: "Jamie Rivera" } } },
    });
    const ContactPage = (await import("@/app/contact/page")).default;

    render(await ContactPage());

    const props = JSON.parse(screen.getByTestId("contact-support-page").textContent ?? "{}");
    expect(props).toEqual({ isAuthenticated: true, userEmail: "jamie@example.com", userFullName: "Jamie Rivera" });
  });

  it("does not redirect anyone — this page is reachable while logged out", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const ContactPage = (await import("@/app/contact/page")).default;

    const element = await ContactPage();

    expect(element).toBeTruthy();
  });
});
