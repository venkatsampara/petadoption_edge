"use client";

import { useState, type FormEvent } from "react";
import { applicationInputSchema } from "@hyderabad-paws/shared";
import type { Pet } from "@/lib/types";

export function ApplicationForm({ pet }: { pet: Pet }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const parsed = applicationInputSchema.safeParse({
      petId: pet.id,
      applicantName: formData.get("applicantName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      area: formData.get("area"),
      message: formData.get("message"),
      housingType: formData.get("housingType"),
    });
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "Please check your details.");
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
      setMessage(`Thanks for applying to meet ${pet.name}. The local rescue team will review your interest.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Application could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-5 grid gap-4" onSubmit={submit} noValidate aria-labelledby="application-form-heading">
      <div>
        <h3 id="application-form-heading" className="font-serif text-xl text-forest">Send an adoption enquiry</h3>
        <p className="mt-1 text-xs leading-5 text-muted">All fields are required. A few details will help the rescue team get to know you.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field-label"><span>Your name</span><input className="field-control" name="applicantName" autoComplete="name" placeholder="Full name" required maxLength={120} /></label>
        <label className="field-label"><span>Email</span><input className="field-control" type="email" name="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} /></label>
        <label className="field-label"><span>Phone</span><input className="field-control" type="tel" name="phone" autoComplete="tel" placeholder="+91 98765 43210" required maxLength={30} /></label>
        <label className="field-label"><span>Your neighbourhood</span><input className="field-control" name="area" autoComplete="address-level2" placeholder="Area in Hyderabad" required maxLength={120} /></label>
      </div>
      <label className="field-label">
        <span>Home type</span>
        <select className="field-control" name="housingType" required defaultValue="">
          <option value="" disabled>Select your home type</option>
          <option>Apartment</option>
          <option>Independent house</option>
          <option>Other</option>
        </select>
      </label>
      <label className="field-label"><span>A little about your home and why you would like to adopt</span><textarea className="field-control min-h-28 resize-y" name="message" placeholder="Tell us about your home, who lives there, and what makes you excited to adopt." required minLength={10} maxLength={5000} /></label>
      {message && <p role="status" className="rounded-xl bg-white px-4 py-3 text-sm leading-6 text-forest">{message}</p>}
      <button className="button w-full" type="submit" disabled={busy}>{busy ? "Sending…" : `Send interest for ${pet.name}`}</button>
      <p className="text-xs leading-5 text-muted">Your details are shared with the rescue team for this adoption enquiry.</p>
    </form>
  );
}

function getApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not configured");
  return url.replace(/\/+$/, "");
}
