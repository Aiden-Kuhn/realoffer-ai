"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Field, inputClasses, selectClasses, textareaClasses } from "@/components/shared/Field";
import { contactSupportSchema, SUPPORT_CATEGORIES, CONTACT_MESSAGE_MAX_LENGTH, type ContactSupportFormValues } from "@/lib/validation/schemas";
import { submitSupportRequest, SUPPORT_EMAIL } from "@/lib/support/submitSupportRequest";

/** Basic spam deterrent alongside the honeypot field below: blocks an
 * immediate repeat submission rather than trying to fully rate-limit
 * (there's no backend to enforce a real limit against yet — see
 * submitSupportRequest.ts). */
const RESUBMIT_COOLDOWN_MS = 15_000;

type ContactSupportFormProps = {
  /** Prefilled from the signed-in user, if any — never required, and
   * logged-out visitors can submit with any name/email of their choosing. */
  defaultName?: string;
  defaultEmail?: string;
};

export function ContactSupportForm({ defaultName = "", defaultEmail = "" }: ContactSupportFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const [lastSubmittedAt, setLastSubmittedAt] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ContactSupportFormValues>({
    resolver: zodResolver(contactSupportSchema),
    defaultValues: { name: defaultName, email: defaultEmail, subject: "", message: "", company: "" },
  });

  const messageLength = (watch("message") ?? "").length;

  async function onSubmit(values: ContactSupportFormValues) {
    if (isSubmitting) return; // guards against a double-click firing two submits

    // Honeypot: a real visitor never sees or fills this field (see the
    // visually-hidden markup below). Pretend to succeed rather than
    // revealing to a bot that its submission was rejected.
    if (values.company) {
      setSucceeded(true);
      return;
    }

    if (lastSubmittedAt !== null && Date.now() - lastSubmittedAt < RESUBMIT_COOLDOWN_MS) {
      setSubmitError("Please wait a few seconds before sending another request.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    const { error } = await submitSupportRequest({ ...values, submittedAt: new Date().toISOString() });
    setIsSubmitting(false);

    if (error) {
      setSubmitError(error);
      return;
    }

    setLastSubmittedAt(Date.now());
    setSucceeded(true);
    reset({ name: values.name, email: values.email, subject: "", message: "", company: "" });
  }

  if (succeeded) {
    return (
      <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-5">
        <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-400" />
        <div>
          <p className="text-sm font-medium text-emerald-300">Your email application should now be open.</p>
          <p className="mt-1.5 text-sm leading-relaxed text-emerald-300/80">
            We&apos;ve pre-filled a message to {SUPPORT_EMAIL} with your details — just hit send in your email app to complete your request. If
            nothing opened, email us directly at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="underline hover:text-emerald-200 break-all">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
          <button
            type="button"
            onClick={() => setSucceeded(false)}
            className="mt-3 text-sm font-medium text-emerald-300 underline hover:text-emerald-200"
          >
            Send another request
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {/* Honeypot field. Visually hidden (not display:none — some bots skip
          those) and removed from both tab order and assistive tech. Real
          users never encounter it. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="contact-company">Company</label>
        <input id="contact-company" type="text" tabIndex={-1} autoComplete="off" {...register("company")} />
      </div>

      {submitError ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-400/10 px-3.5 py-3 text-sm leading-relaxed text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {submitError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Name" htmlFor="contact-name" error={errors.name?.message} required>
          <input id="contact-name" type="text" autoComplete="name" className={inputClasses} {...register("name")} />
        </Field>
        <Field label="Email Address" htmlFor="contact-email" error={errors.email?.message} required>
          <input id="contact-email" type="email" autoComplete="email" placeholder="jamie@example.com" className={inputClasses} {...register("email")} />
        </Field>
      </div>

      <Field label="Subject" htmlFor="contact-subject" error={errors.subject?.message} required>
        <input id="contact-subject" type="text" className={inputClasses} {...register("subject")} />
      </Field>

      <Field label="Category" htmlFor="contact-category" error={errors.category?.message} required>
        <select id="contact-category" defaultValue="" className={selectClasses} {...register("category")}>
          <option value="" disabled>
            Select a category
          </option>
          {SUPPORT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Message"
        htmlFor="contact-message"
        error={errors.message?.message}
        hint={`${messageLength}/${CONTACT_MESSAGE_MAX_LENGTH} characters`}
        required
      >
        <textarea
          id="contact-message"
          rows={6}
          maxLength={CONTACT_MESSAGE_MAX_LENGTH}
          className={textareaClasses}
          {...register("message")}
        />
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 inline-flex items-center justify-center h-11 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-60"
      >
        {isSubmitting ? "Sending…" : "Send Support Request"}
      </button>
    </form>
  );
}
