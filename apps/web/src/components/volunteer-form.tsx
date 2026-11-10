"use client";

import { useState, type FormEvent } from "react";
import { volunteerInputSchema } from "@hyderabad-paws/shared";
import { getFieldErrors } from "@/lib/form-errors";

export function VolunteerForm() {
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage(null);
    setFieldErrors({});
    const formData = new FormData(event.currentTarget);
    const parsed = volunteerInputSchema.safeParse({
      applicantName: formData.get("applicantName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      area: formData.get("area"),
      housingType: formData.get("housingType"),
      message: formData.get("message"),
    });
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
      if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");
      const response = await fetch(`${apiUrl}/volunteer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await response.json() as { error?: { message?: string } };
      if (!response.ok) throw new Error(body.error?.message ?? "Your interest could not be submitted.");
      form.reset();
      setMessage({ kind: "success", text: "Thank you for offering your time. We’ve received your volunteer interest." });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Your interest could not be submitted." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="grid gap-5 rounded-3xl bg-surface p-6 shadow-card sm:p-8" onSubmit={submit} noValidate aria-label="Volunteer interest form">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="field-label"><span>Your name</span><input className="field-control" name="applicantName" autoComplete="name" required maxLength={120} aria-invalid={Boolean(fieldErrors.applicantName)} aria-describedby={fieldErrors.applicantName ? "volunteer-applicantName-error" : undefined} />{fieldErrors.applicantName && <span id="volunteer-applicantName-error" className="field-error">{fieldErrors.applicantName}</span>}</label>
        <label className="field-label"><span>Email</span><input className="field-control" type="email" name="email" autoComplete="email" required maxLength={254} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "volunteer-email-error" : undefined} />{fieldErrors.email && <span id="volunteer-email-error" className="field-error">{fieldErrors.email}</span>}</label>
        <label className="field-label"><span>Phone</span><input className="field-control" type="tel" name="phone" autoComplete="tel" required maxLength={30} aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? "volunteer-phone-error" : undefined} />{fieldErrors.phone && <span id="volunteer-phone-error" className="field-error">{fieldErrors.phone}</span>}</label>
        <label className="field-label"><span>Neighbourhood</span><input className="field-control" name="area" required maxLength={120} aria-invalid={Boolean(fieldErrors.area)} aria-describedby={fieldErrors.area ? "volunteer-area-error" : undefined} />{fieldErrors.area && <span id="volunteer-area-error" className="field-error">{fieldErrors.area}</span>}</label>
      </div>
      <label className="field-label">
        <span>How would you like to help?</span>
        <select className="field-control" name="housingType" defaultValue="" required aria-invalid={Boolean(fieldErrors.housingType)} aria-describedby={fieldErrors.housingType ? "volunteer-housingType-error" : undefined}>
          <option value="" disabled>Select an area of interest</option>
          <option>Fostering</option>
          <option>Pet transport</option>
          <option>Photography or profile writing</option>
          <option>Meet-and-greet support</option>
          <option>Other volunteer support</option>
        </select>
        {fieldErrors.housingType && <span id="volunteer-housingType-error" className="field-error">{fieldErrors.housingType}</span>}
      </label>
      <label className="field-label"><span>Tell us a little more</span><textarea className="field-control min-h-32 resize-y" name="message" minLength={10} maxLength={5000} required aria-invalid={Boolean(fieldErrors.message)} aria-describedby={fieldErrors.message ? "volunteer-message-error" : undefined} />{fieldErrors.message && <span id="volunteer-message-error" className="field-error">{fieldErrors.message}</span>}</label>
      {message && <p role={message.kind === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm leading-6 ${message.kind === "error" ? "status-error" : "bg-soft text-forest"}`}>{message.text}</p>}
      <button className="button w-full sm:w-fit" type="submit" disabled={busy}>{busy ? "Sending…" : "Share my interest"}</button>
    </form>
  );
}
