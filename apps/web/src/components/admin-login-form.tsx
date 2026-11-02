"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { loginInputSchema } from "@hyderabad-paws/shared";
import { adminApi } from "@/lib/admin-api";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const parsed = loginInputSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email and password.");
      return;
    }

    setBusy(true);
    try {
      await adminApi("/auth/login", { method: "POST", body: JSON.stringify(parsed.data) });
      router.replace("/admin");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-shell py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-muted"><ol className="flex gap-2"><li><Link href="/">Home</Link></li><li aria-hidden="true">/</li><li aria-current="page">Admin login</li></ol></nav>
      <section className="mx-auto mt-8 max-w-md rounded-3xl bg-white p-7 shadow-card sm:p-9">
        <p className="eyebrow">Rescue team access</p>
        <h1 className="mt-3 font-serif text-4xl text-forest">Welcome back</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Sign in to manage pet profiles and adoption applications.</p>
        <form onSubmit={submit} className="mt-7 grid gap-5" noValidate>
          <label className="field-label"><span>Email</span><input className="field-control" name="email" type="email" autoComplete="username" required /></label>
          <label className="field-label"><span>Password</span><input className="field-control" name="password" type="password" autoComplete="current-password" required /></label>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
          <button type="submit" className="button w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
      </section>
    </div>
  );
}
