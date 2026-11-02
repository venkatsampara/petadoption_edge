"use client";

import { useState, type FormEvent } from "react";
import { volunteerInputSchema } from "@hyderabad-paws/shared";

export function VolunteerForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage("");
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
      setMessage(parsed.error.issues[0]?.message ?? "Please check your details.");
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
      setMessage("Thank you for offering your time. We’ve received your volunteer interest.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Your interest could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="grid gap-5 rounded-3xl bg-white p-6 shadow-card sm:p-8" onSubmit={submit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="field-label"><span>Your name</span><input className="field-control" name="applicantName" autoComplete="name" required maxLength={120} /></label>
        <label className="field-label"><span>Email</span><input className="field-control" type="email" name="email" autoComplete="email" required maxLength={254} /></label>
        <label className="field-label"><span>Phone</span><input className="field-control" type="tel" name="phone" autoComplete="tel" required maxLength={30} /></label>
        <label className="field-label"><span>Neighbourhood</span><input className="field-control" name="area" required maxLength={120} /></label>
      </div>
      <label className="field-label">
        <span>How would you like to help?</span>
        <select className="field-control" name="housingType" defaultValue="" required>
          <option value="" disabled>Select an area of interest</option>
          <option>Fostering</option>
          <option>Pet transport</option>
          <option>Photography or profile writing</option>
          <option>Meet-and-greet support</option>
          <option>Other volunteer support</option>
        </select>
      </label>
      <label className="field-label"><span>Tell us a little more</span><textarea className="field-control min-h-32 resize-y" name="message" minLength={10} maxLength={5000} required /></label>
      {message && <p role="status" className="rounded-xl bg-[#E9F0EA] px-4 py-3 text-sm leading-6 text-forest">{message}</p>}
      <button className="button w-full sm:w-fit" type="submit" disabled={busy}>{busy ? "Sending…" : "Share my interest"}</button>
    </form>
  );
}
