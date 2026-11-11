"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { adminApi } from "@/lib/admin-api";

export function CaretakerAuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isRegister = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    if (isRegister && password !== data.get("confirmPassword")) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await adminApi(`/caretaker/${mode}`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.replace("/caretaker");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to access your account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="public-theme page-shell py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/">Home</Link> <span aria-hidden="true">/</span> Caretaker account
      </nav>
      <section className="mx-auto mt-8 max-w-md rounded-3xl bg-surface p-7 shadow-card sm:p-9">
        <p className="eyebrow">Caretaker account</p>
        <h1 className="mt-3 font-serif text-4xl text-forest">
          {isRegister ? "Create an account" : "Welcome back"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {isRegister
            ? "After you submit a pet, an administrator must verify you and link your account before you can manage that pet. Creating an account does not verify your email or automatically claim a listing."
            : "Sign in to manage pets linked to your account and view their adoption enquiries."}
        </p>
        <form onSubmit={submit} className="mt-7 grid gap-5">
          <label className="field-label">
            <span>Email</span>
            <input className="field-control" name="email" type="email" autoComplete="email" required maxLength={254} />
          </label>
          <label className="field-label">
            <span>Password</span>
            <input className="field-control" name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} required minLength={isRegister ? 8 : undefined} maxLength={72} />
            {isRegister && <span className="text-xs font-normal text-muted">Use at least 8 characters and no more than 72 UTF-8 bytes. Keep your password safe.</span>}
          </label>
          {isRegister && (
            <label className="field-label">
              <span>Confirm password</span>
              <input className="field-control" name="confirmPassword" type="password" autoComplete="new-password" required maxLength={72} />
            </label>
          )}
          {error && <p role="alert" className="status-error rounded-xl px-4 py-3 text-sm">{error}</p>}
          <button type="submit" className="button w-full" disabled={busy}>
            {busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
          </button>
        </form>
        <p className="mt-5 text-sm leading-6 text-muted">
          {isRegister ? "Already have an account? " : "Need an account? "}
          <Link className="font-bold text-forest underline" href={isRegister ? "/caretaker/login" : "/caretaker/register"}>
            {isRegister ? "Sign in" : "Create one"}
          </Link>
        </p>
        <p className="mt-3 text-sm leading-6 text-muted">
          No automatic password recovery is available. If you lose access, create a new account and request a link using your submission reference; an administrator must verify you before reassigning it.
        </p>
      </section>
    </div>
  );
}
