// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactSupportForm } from "@/components/support/ContactSupportForm";

const submitSupportRequestMock = vi.fn();

vi.mock("@/lib/support/submitSupportRequest", () => ({
  submitSupportRequest: (...args: unknown[]) => submitSupportRequestMock(...args),
  SUPPORT_EMAIL: "realoffersupport@gmail.com",
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function fillValidForm(user: ReturnType<typeof userEvent.setup>, overrides: { message?: string } = {}) {
  // Cleared first: reusing this helper for a second submission (e.g. after
  // "Send another request") lands on a form whose name/email fields are
  // still populated from the prior submit's reset() call — typing without
  // clearing would append and corrupt the email's format.
  const nameField = screen.getByLabelText("Name", { exact: false });
  const emailField = screen.getByLabelText("Email Address", { exact: false });
  const subjectField = screen.getByLabelText("Subject", { exact: false });
  const messageField = screen.getByLabelText("Message", { exact: false });
  await user.clear(nameField);
  await user.type(nameField, "Jamie Rivera");
  await user.clear(emailField);
  await user.type(emailField, "jamie@example.com");
  await user.clear(subjectField);
  await user.type(subjectField, "Trouble saving a deal");
  await user.selectOptions(screen.getByLabelText("Category", { exact: false }), "Technical Issue");
  await user.clear(messageField);
  await user.type(messageField, overrides.message ?? "The save button doesn't respond.");
}

describe("ContactSupportForm — rendering", () => {
  it("labels every field and lists the required category options", () => {
    render(<ContactSupportForm />);

    expect(screen.getByLabelText("Name", { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText("Email Address", { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText("Subject", { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText("Category", { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText("Message", { exact: false })).toBeInTheDocument();

    for (const category of ["Account Help", "Property Analysis", "Saved Deals", "Contracts", "Billing", "Technical Issue", "Feature Request", "Other"]) {
      expect(screen.getByRole("option", { name: category })).toBeInTheDocument();
    }
  });

  it("prefills name and email for a signed-in visitor", () => {
    render(<ContactSupportForm defaultName="Jamie Rivera" defaultEmail="jamie@example.com" />);

    expect(screen.getByLabelText("Name", { exact: false })).toHaveValue("Jamie Rivera");
    expect(screen.getByLabelText("Email Address", { exact: false })).toHaveValue("jamie@example.com");
  });
});

describe("ContactSupportForm — validation", () => {
  it("requires every field", async () => {
    const user = userEvent.setup();
    render(<ContactSupportForm />);

    await user.click(screen.getByRole("button", { name: "Send Support Request" }));

    expect(await screen.findByText("Enter your name.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter a subject.")).toBeInTheDocument();
    expect(screen.getByText("Choose a category.")).toBeInTheDocument();
    expect(screen.getByText("Enter a message.")).toBeInTheDocument();
    expect(submitSupportRequestMock).not.toHaveBeenCalled();
  });

  it("rejects a malformed email", async () => {
    const user = userEvent.setup();
    render(<ContactSupportForm />);

    await user.type(screen.getByLabelText("Email Address", { exact: false }), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Send Support Request" }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
  });

  it("rejects a message over the character limit", async () => {
    const user = userEvent.setup();
    render(<ContactSupportForm />);

    // fireEvent.change (not a raw manual .value assignment) so React's
    // controlled-input tracking actually registers the new value — this
    // exercises the schema-level bound directly rather than typing 2001
    // characters through userEvent (slow and redundant), while the
    // textarea's own maxLength=2000 HTML attribute is what stops a real
    // user from ever typing this many characters interactively.
    const textarea = screen.getByLabelText("Message", { exact: false });
    fireEvent.change(textarea, { target: { value: "x".repeat(2001) } });
    await user.click(screen.getByRole("button", { name: "Send Support Request" }));

    expect(await screen.findByText("Message must be 2000 characters or fewer.")).toBeInTheDocument();
  });

  it("shows a live character counter for the message field", async () => {
    const user = userEvent.setup();
    render(<ContactSupportForm />);

    expect(screen.getByText("0/2000 characters")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Message", { exact: false }), "hello");
    expect(screen.getByText("5/2000 characters")).toBeInTheDocument();
  });
});

describe("ContactSupportForm — submission", () => {
  it("shows a loading state and disables the button while sending", async () => {
    let resolveRequest: (value: { error: string | null }) => void = () => {};
    submitSupportRequestMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const user = userEvent.setup();
    render(<ContactSupportForm />);
    await fillValidForm(user);

    await user.click(screen.getByRole("button", { name: "Send Support Request" }));

    expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
    resolveRequest({ error: null });
    await waitFor(() => expect(screen.getByText(/email application should now be open/)).toBeInTheDocument());
  });

  it("passes all form fields plus a submission timestamp to submitSupportRequest", async () => {
    submitSupportRequestMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<ContactSupportForm />);
    await fillValidForm(user);

    await user.click(screen.getByRole("button", { name: "Send Support Request" }));

    await waitFor(() => expect(submitSupportRequestMock).toHaveBeenCalledTimes(1));
    const [submittedInput] = submitSupportRequestMock.mock.calls[0];
    expect(submittedInput).toMatchObject({
      name: "Jamie Rivera",
      email: "jamie@example.com",
      subject: "Trouble saving a deal",
      category: "Technical Issue",
      message: "The save button doesn't respond.",
    });
    expect(typeof submittedInput.submittedAt).toBe("string");
  });

  it("shows a clear success message after submission", async () => {
    submitSupportRequestMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<ContactSupportForm />);
    await fillValidForm(user);

    await user.click(screen.getByRole("button", { name: "Send Support Request" }));

    expect(await screen.findByText(/email application should now be open/)).toBeInTheDocument();
    expect(screen.getAllByText(/realoffersupport@gmail.com/).length).toBeGreaterThan(0);
  });

  it("shows a clear error message if submission fails, and stays on the form", async () => {
    submitSupportRequestMock.mockResolvedValue({ error: "Your message is too long to send this way." });
    const user = userEvent.setup();
    render(<ContactSupportForm />);
    await fillValidForm(user);

    await user.click(screen.getByRole("button", { name: "Send Support Request" }));

    expect(await screen.findByText("Your message is too long to send this way.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send Support Request" })).toBeInTheDocument();
  });

  it("prevents a duplicate submission while a request is already in flight", async () => {
    let resolveRequest: (value: { error: string | null }) => void = () => {};
    submitSupportRequestMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const user = userEvent.setup();
    render(<ContactSupportForm />);
    await fillValidForm(user);

    const button = screen.getByRole("button", { name: "Send Support Request" });
    await user.click(button);
    await user.click(screen.getByRole("button", { name: "Sending…" }));

    expect(submitSupportRequestMock).toHaveBeenCalledTimes(1);
    resolveRequest({ error: null });
    await waitFor(() => expect(screen.getByText(/email application should now be open/)).toBeInTheDocument());
  });

  it("silently treats a filled-in honeypot field as success without ever calling submitSupportRequest", async () => {
    const user = userEvent.setup();
    render(<ContactSupportForm />);
    await fillValidForm(user);
    // A real visitor never fills this — simulating a bot that fills every
    // input it finds, including the visually-hidden honeypot.
    const honeypot = document.getElementById("contact-company") as HTMLInputElement;
    await user.type(honeypot, "Some Bot LLC");

    await user.click(screen.getByRole("button", { name: "Send Support Request" }));

    expect(await screen.findByText(/email application should now be open/)).toBeInTheDocument();
    expect(submitSupportRequestMock).not.toHaveBeenCalled();
  });

  it("enforces a brief cooldown before allowing another submission", async () => {
    submitSupportRequestMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<ContactSupportForm />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Send Support Request" }));
    await screen.findByText(/email application should now be open/);

    await user.click(screen.getByRole("button", { name: "Send another request" }));
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Send Support Request" }));

    expect(await screen.findByText(/wait a few seconds/)).toBeInTheDocument();
    expect(submitSupportRequestMock).toHaveBeenCalledTimes(1);
  });
});
