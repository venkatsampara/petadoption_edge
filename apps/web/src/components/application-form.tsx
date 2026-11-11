"use client";

import { useRef, useState, type FormEvent } from "react";
import { applicationInputSchema } from "@hyderabad-paws/shared";
import type { Pet } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import { getFieldErrors } from "@/lib/form-errors";

const applicationFields = ["applicantName", "email", "phone", "area", "housingType", "message"];

export function ApplicationForm({ pet }: { pet: Pet }) {
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [completedFields, setCompletedFields] = useState(0);
  const enquiryStarted = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage(null);
    setFieldErrors({});
    const formData = new FormData(event.currentTarget);
    const parsed = parseApplicationForm(formData, pet.id);
    if (!parsed.success) {
      const errors = getFieldErrors(parsed.error.issues);
      setFieldErrors(errors);
      setMessage({ kind: "error", text: "Please check the highlighted fields and try again." });
      const firstField = parsed.error.issues[0]?.path[0];
      if (typeof firstField === "string") {
        const invalidControl = form.elements.namedItem(firstField);
        if (invalidControl instanceof HTMLElement) invalidControl.focus();
      }
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`${getApiUrl()}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await response.json() as { error?: { message?: string } };
      if (!response.ok) throw new Error(body.error?.message ?? "Application could not be submitted.");
      form.reset();
      setCompletedFields(0);
      setMessage({ kind: "success", text: `Thanks for applying to meet ${pet.name}. The local rescue team will review your interest.` });
      trackEvent("submit_adoption_enquiry", { pet_id: pet.id });
      enquiryStarted.current = false;
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Application could not be submitted." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="mt-5 grid gap-4"
      onSubmit={submit}
      noValidate
      aria-labelledby="application-form-heading"
      onFocusCapture={() => {
        if (enquiryStarted.current) return;
        enquiryStarted.current = true;
        trackEvent("start_adoption_enquiry", { pet_id: pet.id });
      }}
      onChange={(event) => {
        const values = new FormData(event.currentTarget);
        const parsed = parseApplicationForm(values, pet.id);
        const invalidFields = new Set(
          parsed.success ? [] : parsed.error.issues.map((issue) => String(issue.path[0])),
        );
        setCompletedFields(applicationFields.filter((field) => !invalidFields.has(field)).length);
        const target = event.target;
        const field = target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement
          ? target.name
          : "";
        if (field) {
          setFieldErrors((current) => {
            if (!current[field]) return current;
            const next = { ...current };
            delete next[field];
            return next;
          });
        }
      }}
    >
      <div>
        <h3 id="application-form-heading" className="font-serif text-xl text-forest">Send an adoption enquiry</h3>
        <p className="mt-1 text-xs leading-5 text-muted">All fields are required. A few details will help the rescue team get to know you.</p>
        <p className="mt-4 text-xs font-semibold text-muted">{completedFields} of 6 required details completed</p>
        <progress className="form-progress mt-2" max={6} value={completedFields} aria-label={`${completedFields} of 6 required details completed`} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field-label"><span>Your name</span><input className="field-control" name="applicantName" autoComplete="name" placeholder="Full name" required maxLength={120} aria-invalid={Boolean(fieldErrors.applicantName)} aria-describedby={fieldErrors.applicantName ? "application-applicantName-error" : undefined} />{fieldErrors.applicantName && <span id="application-applicantName-error" className="field-error">{fieldErrors.applicantName}</span>}</label>
        <label className="field-label"><span>Email</span><input className="field-control" type="email" name="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "application-email-error" : undefined} />{fieldErrors.email && <span id="application-email-error" className="field-error">{fieldErrors.email}</span>}</label>
        <label className="field-label"><span>Phone</span><input className="field-control" type="tel" name="phone" autoComplete="tel" placeholder="+91 98765 43210" required maxLength={30} aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? "application-phone-error" : undefined} />{fieldErrors.phone && <span id="application-phone-error" className="field-error">{fieldErrors.phone}</span>}</label>
        <label className="field-label"><span>Your neighbourhood</span><input className="field-control" name="area" autoComplete="address-level2" placeholder="Area in Hyderabad" required maxLength={120} aria-invalid={Boolean(fieldErrors.area)} aria-describedby={fieldErrors.area ? "application-area-error" : undefined} />{fieldErrors.area && <span id="application-area-error" className="field-error">{fieldErrors.area}</span>}</label>
      </div>
      <label className="field-label">
        <span>Home type</span>
        <select className="field-control" name="housingType" required defaultValue="" aria-invalid={Boolean(fieldErrors.housingType)} aria-describedby={fieldErrors.housingType ? "application-housingType-error" : undefined}>
          <option value="" disabled>Select your home type</option>
          <option>Apartment</option>
          <option>Independent house</option>
          <option>Other</option>
        </select>
        {fieldErrors.housingType && <span id="application-housingType-error" className="field-error">{fieldErrors.housingType}</span>}
      </label>
      <label className="field-label"><span>A little about your home and why you would like to adopt</span><textarea className="field-control min-h-28 resize-y" name="message" placeholder="Tell us about your home, who lives there, and what makes you excited to adopt." required minLength={10} maxLength={5000} aria-invalid={Boolean(fieldErrors.message)} aria-describedby={fieldErrors.message ? "application-message-error" : undefined} />{fieldErrors.message && <span id="application-message-error" className="field-error">{fieldErrors.message}</span>}</label>
      {message && <p role={message.kind === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm leading-6 ${message.kind === "error" ? "status-error" : "bg-soft text-forest"}`}>{message.text}</p>}
      <button className="button w-full" type="submit" disabled={busy}>{busy ? "Sending…" : `Send interest for ${pet.name}`}</button>
      <p className="text-xs leading-5 text-muted">Your details are shared with the rescue team for this adoption enquiry.</p>
    </form>
  );
}

function parseApplicationForm(formData: FormData, petId: string) {
  return applicationInputSchema.safeParse({
    petId,
    applicantName: formData.get("applicantName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    area: formData.get("area"),
    message: formData.get("message"),
    housingType: formData.get("housingType"),
  });
}

function getApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not configured");
  return url.replace(/\/+$/, "");
}
