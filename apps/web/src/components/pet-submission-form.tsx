"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { normalizeWhatsAppNumber, petGenderSchema, petSizeSchema, petSpeciesSchema } from "@hyderabad-paws/shared";
import { z } from "zod";
import { getFieldErrors } from "@/lib/form-errors";

const imageUrl = z.string().max(2048).url().refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com"
      && !url.username && !url.password && !url.port && !url.search && !url.hash
      && /^\/[^/]+\/image\/upload\/.+/.test(url.pathname) && !/%2f|%5c|%2e/i.test(url.pathname);
  } catch {
    return false;
  }
}, "Enter HTTPS Cloudinary image URLs, one per line.");

const submissionSchema = z.object({
  contactName: z.string().trim().min(1, "Enter your name.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  phone: z.string().trim().min(7, "Enter a valid phone number.").max(30),
  name: z.string().trim().min(1, "Enter the pet's name.").max(120),
  species: petSpeciesSchema,
  area: z.string().trim().min(1, "Enter an area.").max(120),
  description: z.string().trim().min(1, "Enter a description.").max(10000),
  breed: z.string().trim().max(120).optional(),
  ageMonths: z.number().int("Enter a whole number of months.").nonnegative("Age cannot be negative.").max(600).finite().optional(),
  gender: petGenderSchema.optional(),
  size: petSizeSchema.optional(),
  vaccinated: z.boolean().optional(),
  sterilized: z.boolean().optional(),
  images: z.array(imageUrl).max(10, "Enter no more than 10 photo URLs.").optional(),
  whatsappNumber: z.string().trim().max(30)
    .refine((value) => normalizeWhatsAppNumber(value) !== null, "Enter a valid Indian mobile number.").optional(),
  whatsappConsent: z.boolean().optional(),
}).superRefine((value, context) => {
  if (value.whatsappNumber && !value.whatsappConsent) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["whatsappConsent"], message: "Please confirm permission to publish this WhatsApp number." });
  }
  if (value.whatsappConsent && !value.whatsappNumber) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["whatsappNumber"], message: "Enter a WhatsApp number or uncheck consent." });
  }
});

type FieldProps = {
  name: string;
  label: string;
  errors: Record<string, string>;
  hint?: string;
  children: ReactNode;
};

function Field({ name, label, errors, hint, children }: FieldProps) {
  return (
    <div className="field-label">
      <label htmlFor={`submission-${name}`}>{label}</label>
      {children}
      {hint && <span id={`submission-${name}-hint`} className="text-xs font-normal text-muted">{hint}</span>}
      {errors[name] && <span id={`submission-${name}-error`} className="field-error">{errors[name]}</span>}
    </div>
  );
}

export function PetSubmissionForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [id, setId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function control(name: string, hint = false) {
    return {
      id: `submission-${name}`,
      name,
      className: "field-control",
      "aria-invalid": Boolean(errors[name]),
      "aria-describedby": [hint && `submission-${name}-hint`, errors[name] && `submission-${name}-error`].filter(Boolean).join(" ") || undefined,
    };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const text = (name: string) => String(formData.get(name) ?? "").trim();
    const optional = (name: string) => text(name) || undefined;
    const boolean = (name: string) => text(name) === "" ? undefined : text(name) === "true";
    const images = text("images").split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
    const parsed = submissionSchema.safeParse({
      contactName: text("contactName"), email: text("email"), phone: text("phone"),
      name: text("name"), species: text("species"), area: text("area"), description: text("description"),
      breed: optional("breed"), ageMonths: text("ageMonths") === "" ? undefined : Number(text("ageMonths")),
      gender: optional("gender"), size: optional("size"),
      vaccinated: boolean("vaccinated"), sterilized: boolean("sterilized"),
      images: images.length ? images : undefined,
      whatsappNumber: optional("whatsappNumber"), whatsappConsent: formData.get("whatsappConsent") === "on" ? true : undefined,
    });
    setError("");
    setErrors({});
    if (!parsed.success) {
      setErrors(getFieldErrors(parsed.error.issues));
      setError("Please check the highlighted fields and try again.");
      const field = parsed.error.issues[0]?.path[0];
      if (typeof field === "string") {
        const element = form.elements.namedItem(field);
        if (element instanceof HTMLElement) element.focus();
      }
      return;
    }

    setBusy(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
      if (!apiUrl) throw new Error("The submission service is not configured. Please try again later.");
      const response = await fetch(`${apiUrl}/pet-submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(parsed.data),
      });
      let body: { data?: { id?: unknown } | null; error?: { message?: string } | null };
      try {
        body = await response.json();
      } catch {
        throw new Error("The submission service returned an invalid response. Please contact the team before trying again.");
      }
      if (!response.ok || body?.error) throw new Error(body?.error?.message || "Your submission could not be sent. Please try again.");
      if (typeof body?.data?.id !== "string" || !body.data.id) {
        throw new Error("The submission service did not return a reference ID. Please contact the team before trying again.");
      }
      setId(body.data.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your submission could not be sent. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (id) {
    return (
      <div role="status" className="rounded-3xl bg-surface p-6 shadow-card sm:p-8">
        <h2 className="section-title">Thank you for sharing.</h2>
        <p className="mt-4 leading-7 text-muted">Your submission reference ID is <strong className="break-all text-forest">{id}</strong>. Please keep it for your records.</p>
        <p className="mt-3 leading-7 text-muted">Our admin team will review the submission before publication and may contact you manually. This submission does not automatically create an account or claim ownership of a listing.</p>
        <p className="mt-3 leading-7 text-muted">To request management access, <a className="font-bold text-forest underline" href="/caretaker/register">create a caretaker account</a> and enter this reference in the account link request form.</p>
      </div>
    );
  }

  return (
    <form className="rounded-3xl bg-surface p-6 shadow-card sm:p-8" onSubmit={submit} noValidate aria-label="Post a pet form">
      <p className="text-sm text-muted">Fields marked * are required.</p>
      <p className="mt-2 text-sm leading-6 text-muted">
        The Hyderabad Paws team uses your contact details to review this submission and contact you. Your email and phone are not published in the pet profile. A WhatsApp number is public only if you provide it and consent below. Photo URLs may already be publicly accessible through their hosting service.
      </p>
      <fieldset disabled={busy} className="mt-6 grid gap-5">
        <legend className="font-serif text-2xl font-semibold text-forest">Your contact details</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="contactName" label="Your name *" errors={errors}><input {...control("contactName")} autoComplete="name" required maxLength={120} /></Field>
          <Field name="email" label="Email *" errors={errors}><input {...control("email")} type="email" autoComplete="email" required maxLength={254} /></Field>
          <Field name="phone" label="Phone *" errors={errors}><input {...control("phone")} type="tel" autoComplete="tel" required maxLength={30} /></Field>
        </div>
        <h2 className="mt-3 font-serif text-2xl font-semibold text-forest">About the pet</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="name" label="Pet name *" errors={errors}><input {...control("name")} required maxLength={120} /></Field>
          <Field name="species" label="Species *" errors={errors}><select {...control("species")} required defaultValue=""><option value="" disabled>Select species</option><option value="dog">Dog</option><option value="cat">Cat</option><option value="other">Other</option></select></Field>
          <Field name="area" label="Area *" errors={errors}><input {...control("area")} required maxLength={120} /></Field>
          <Field name="breed" label="Breed (optional)" errors={errors}><input {...control("breed")} maxLength={120} /></Field>
          <Field name="ageMonths" label="Age in months (optional)" errors={errors}><input {...control("ageMonths")} type="number" min="0" max="600" step="1" /></Field>
          <Field name="gender" label="Gender (optional)" errors={errors}><select {...control("gender")} defaultValue=""><option value="">Not sure</option><option value="male">Male</option><option value="female">Female</option></select></Field>
          <Field name="size" label="Size (optional)" errors={errors}><select {...control("size")} defaultValue=""><option value="">Not sure</option><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></Field>
          <Field name="vaccinated" label="Vaccinated? (optional)" errors={errors}><select {...control("vaccinated")} defaultValue=""><option value="">Not sure</option><option value="true">Yes</option><option value="false">No</option></select></Field>
          <Field name="sterilized" label="Sterilized? (optional)" errors={errors}><select {...control("sterilized")} defaultValue=""><option value="">Not sure</option><option value="true">Yes</option><option value="false">No</option></select></Field>
        </div>
        <Field name="description" label="Description *" errors={errors}><textarea {...control("description")} className="field-control min-h-32 resize-y" required maxLength={10000} /></Field>
        <Field name="images" label="Photo URLs (optional)" errors={errors} hint="Up to 10 HTTPS image URLs from the site's configured Cloudinary cloud, one per line, without query strings or fragments. Photos are optional and will be reviewed before publication."><textarea {...control("images", true)} className="field-control min-h-24 resize-y" placeholder="https://res.cloudinary.com/…/image/upload/…" /></Field>
        <Field name="whatsappNumber" label="WhatsApp number (optional)" errors={errors} hint="Indian mobile number only. If approved, this number may be published on the pet profile."><input {...control("whatsappNumber", true)} type="tel" maxLength={30} placeholder="+91 98765 43210" /></Field>
        <div>
          <label className="inline-flex items-start gap-2 text-sm text-forest">
            <input id="submission-whatsappConsent" name="whatsappConsent" type="checkbox" className="mt-1" aria-invalid={Boolean(errors.whatsappConsent)} aria-describedby={errors.whatsappConsent ? "submission-whatsappConsent-error" : undefined} />
            <span>I have permission to publish this WhatsApp number and receive adoption enquiries on it.</span>
          </label>
          {errors.whatsappConsent && <p id="submission-whatsappConsent-error" className="field-error">{errors.whatsappConsent}</p>}
        </div>
        {error && <p role="alert" className="status-error rounded-xl px-4 py-3 text-sm leading-6">{error}</p>}
        <button className="button w-full sm:w-fit" type="submit" disabled={busy}>{busy ? "Sending…" : "Submit for review"}</button>
      </fieldset>
    </form>
  );
}
