"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { AdminClaim, AdminPetEdit, AdminSubmission } from "@hyderabad-paws/shared";
import { adminApi, AdminApiError } from "@/lib/admin-api";

type QueueState<T> = {
  items: T[];
  loading: boolean;
  busy: boolean;
  error: string;
  message: string;
};

function initialQueue<T>(): QueueState<T> {
  return { items: [], loading: true, busy: false, error: "", message: "" };
}

function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function safeImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function Images({ images }: { images: unknown }) {
  if (!Array.isArray(images) || images.length === 0) return <span>None provided</span>;
  return (
    <ul className="space-y-1">
      {images.map((image, index) => {
        const url = safeImageUrl(image);
        return (
          <li key={index} className="break-all">
            {url
              ? <a className="font-bold text-forest underline" href={url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Open image {index + 1}</a>
              : <span>Image {index + 1}: invalid or unsafe URL (not linked)</span>}
          </li>
        );
      })}
    </ul>
  );
}

function Details({ fields }: { fields: [string, unknown][] }) {
  return (
    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
      {fields.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="font-bold text-forest">{label}</dt>
          <dd className="whitespace-pre-wrap break-words">{display(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function ReviewActions({ busy, decisions, onReview }: {
  busy: boolean;
  decisions: { value: string; label: string }[];
  onReview: (decision: string, note: string) => Promise<boolean>;
}) {
  const [note, setNote] = useState("");
  return (
    <div className="mt-5 border-t border-forest/10 pt-4">
      <label className="block text-sm font-bold text-forest">
        Review note (optional)
        <textarea className="mt-2 block w-full rounded-lg border border-forest/30 bg-transparent p-2 font-normal text-ink" rows={2} value={note} onChange={(event) => setNote(event.target.value)} disabled={busy} />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        {decisions.map(({ value, label }) => (
          <button key={value} type="button" className="button button-outline disabled:opacity-50" disabled={busy} onClick={() => {
            void onReview(value, note).then((success) => { if (success) setNote(""); });
          }}>{label}</button>
        ))}
      </div>
    </div>
  );
}

function LinkAccount({ busy, onLink }: { busy: boolean; onLink: (email: string) => Promise<boolean> }) {
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(false);
  return (
    <form className="mt-5 border-t border-forest/10 pt-4" onSubmit={(event) => {
      event.preventDefault();
      if (!verified || !email || email !== email.trim()) return;
      void onLink(email).then((success) => {
        if (success) { setEmail(""); setVerified(false); }
      });
    }}>
      <h4 className="font-bold text-forest">Manually link account</h4>
      <p className="mt-1 text-sm">Warning: linking may grant account access to this submission. Verify ownership offline first; enter the exact account email. Do not rely on the submitted contact details alone.</p>
      <label className="mt-3 block text-sm font-bold text-forest">
        Exact account email
        <input type="email" required autoComplete="off" className="mt-2 block w-full rounded-lg border border-forest/30 bg-transparent p-2 font-normal text-ink" value={email} onChange={(event) => { setEmail(event.target.value); setVerified(false); }} disabled={busy} />
      </label>
      <label className="mt-3 flex items-start gap-2 text-sm">
        <input type="checkbox" required checked={verified} onChange={(event) => setVerified(event.target.checked)} disabled={busy} />
        I have verified offline that this exact account belongs to the submitter.
      </label>
      <button type="submit" className="button button-outline mt-3 disabled:opacity-50" disabled={busy || !verified || !email}>Link account</button>
    </form>
  );
}

export function AdminPostModeration() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<QueueState<AdminSubmission>>(initialQueue);
  const [edits, setEdits] = useState<QueueState<AdminPetEdit>>(initialQueue);
  const [claims, setClaims] = useState<QueueState<AdminClaim>>(initialQueue);

  const handleError = useCallback((reason: unknown) => {
    if (reason instanceof AdminApiError && reason.status === 401) {
      router.replace("/admin/login");
    }
    return reason instanceof Error ? reason.message : "The moderation request failed.";
  }, [router]);

  const loadSubmissions = useCallback(async (signal?: AbortSignal) => {
    setSubmissions((current) => ({ ...current, loading: true, error: "" }));
    try {
      const items = await adminApi<AdminSubmission[]>("/admin/submissions", { signal });
      if (!signal?.aborted) setSubmissions((current) => ({ ...current, items, loading: false }));
    } catch (reason) {
      if (!signal?.aborted) {
        const error = handleError(reason);
        setSubmissions((current) => ({ ...current, loading: false, error }));
      }
    }
  }, [handleError]);

  const loadEdits = useCallback(async (signal?: AbortSignal) => {
    setEdits((current) => ({ ...current, loading: true, error: "" }));
    try {
      const items = await adminApi<AdminPetEdit[]>("/admin/pet-edits", { signal });
      if (!signal?.aborted) setEdits((current) => ({ ...current, items, loading: false }));
    } catch (reason) {
      if (!signal?.aborted) {
        const error = handleError(reason);
        setEdits((current) => ({ ...current, loading: false, error }));
      }
    }
  }, [handleError]);

  const loadClaims = useCallback(async (signal?: AbortSignal) => {
    setClaims((current) => ({ ...current, loading: true, error: "" }));
    try {
      const items = await adminApi<AdminClaim[]>("/admin/claims", { signal });
      if (!signal?.aborted) setClaims((current) => ({ ...current, items, loading: false }));
    } catch (reason) {
      if (!signal?.aborted) setClaims((current) => ({ ...current, loading: false, error: handleError(reason) }));
    }
  }, [handleError]);

  useEffect(() => {
    const controller = new AbortController();
    void loadSubmissions(controller.signal);
    void loadEdits(controller.signal);
    void loadClaims(controller.signal);
    return () => controller.abort();
  }, [loadSubmissions, loadEdits, loadClaims]);

  async function act(queue: "submissions" | "pet-edits", id: string, action: "review" | "link", body: object) {
    function updateQueue(update: Partial<Omit<QueueState<never>, "items">>) {
      if (queue === "submissions") setSubmissions((current) => ({ ...current, ...update }));
      else setEdits((current) => ({ ...current, ...update }));
    }
    updateQueue({ busy: true, error: "", message: "" });
    try {
      await adminApi(`/admin/${queue}/${encodeURIComponent(id)}/${action}`, { method: "POST", body: JSON.stringify(body) });
      updateQueue({ message: action === "link" ? "Account linked." : "Review saved." });
      if (queue === "submissions") await loadSubmissions();
      else await loadEdits();
      return true;
    } catch (reason) {
      updateQueue({ error: handleError(reason) });
      return false;
    } finally {
      updateQueue({ busy: false });
    }
  }

  async function reviewClaim(id: string, decision: string, note: string) {
    setClaims((current) => ({ ...current, busy: true, error: "", message: "" }));
    try {
      await adminApi(`/admin/claims/${encodeURIComponent(id)}/review`, { method: "POST", body: JSON.stringify({ decision, ...(note ? { note } : {}) }) });
      await loadClaims();
      setClaims((current) => ({ ...current, message: "Claim review saved. Resolving a claim does not link an account." }));
      return true;
    } catch (reason) {
      setClaims((current) => ({ ...current, error: handleError(reason) }));
      return false;
    } finally {
      setClaims((current) => ({ ...current, busy: false }));
    }
  }

  async function deleteSubmission(item: AdminSubmission) {
    if (!window.confirm("Delete this submission and its claim requests? Published pets and externally hosted images will not be deleted.")) return;
    setSubmissions((current) => ({ ...current, busy: true, error: "", message: "" }));
    try {
      await adminApi(`/admin/submissions/${encodeURIComponent(item.id)}`, { method: "DELETE" });
      await Promise.all([loadSubmissions(), loadClaims()]);
      setSubmissions((current) => ({ ...current, message: "Submission metadata deleted." }));
    } catch (reason) {
      setSubmissions((current) => ({ ...current, error: handleError(reason) }));
    } finally {
      setSubmissions((current) => ({ ...current, busy: false }));
    }
  }

  async function republish(edit: AdminPetEdit) {
    if (!window.confirm("Republish this pet after reviewing the approved request?")) return;
    setEdits((current) => ({ ...current, busy: true, error: "", message: "" }));
    try {
      await adminApi(`/admin/pets/${encodeURIComponent(edit.petId)}/republish`, { method: "POST", body: "{}" });
      await loadEdits();
      setEdits((current) => ({ ...current, message: "Pet republished. Refresh the dashboard to update the pet list." }));
    } catch (reason) {
      setEdits((current) => ({ ...current, error: handleError(reason) }));
    } finally {
      setEdits((current) => ({ ...current, busy: false }));
    }
  }

  return (
    <section className="mt-14" aria-labelledby="post-moderation-heading">
      <h2 id="post-moderation-heading" className="font-serif text-3xl text-forest">Post a Pet moderation</h2>
      <p className="mt-2 text-sm text-muted">Private submitter details are shown here for moderation only. Image links are unverified; open them with caution.</p>

      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-serif text-2xl text-forest">Pet submissions ({submissions.items.length})</h3>
          <button className="button button-outline disabled:opacity-50" disabled={submissions.loading || submissions.busy} onClick={() => void loadSubmissions()}>Refresh submissions</button>
        </div>
        {submissions.loading && <p className="mt-3" role="status">Loading submissions…</p>}
        {submissions.error && <p className="status-error mt-3 rounded-xl px-4 py-3 text-sm" role="alert">{submissions.error}</p>}
        {submissions.message && <p className="mt-3 text-sm" role="status">{submissions.message}</p>}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {submissions.items.map((item) => (
            <article key={item.id} className="rounded-2xl bg-surface p-5 shadow-sm">
              <h4 className="font-serif text-xl text-forest">{item.details.name} · {item.status}</h4>
              <Details fields={[
                ["Submission ID", item.id], ["Created", item.createdAt], ["Contact name", item.details.contactName], ["Email", item.details.email], ["Phone", item.details.phone],
                ["Species", item.details.species], ["Area", item.details.area], ["Description", item.details.description], ["Breed", item.details.breed], ["Age (months)", item.details.ageMonths],
                ["Gender", item.details.gender], ["Size", item.details.size], ["Vaccinated", item.details.vaccinated], ["Sterilized", item.details.sterilized],
                ["WhatsApp number", item.details.whatsappNumber], ["WhatsApp consent", item.details.whatsappConsent], ["Pet ID", item.petId], ["Caretaker ID", item.caretakerId], ["Previous review note", item.reviewNote],
              ]} />
              <div className="mt-3 text-sm"><p className="font-bold text-forest">Images</p><Images images={item.details.images} /></div>
              {(item.status === "pending" || item.status === "clarification") && <ReviewActions busy={submissions.busy || submissions.loading} decisions={[{ value: "approve", label: "Approve" }, { value: "reject", label: "Reject" }, { value: "clarification", label: "Request clarification" }]} onReview={(decision, note) => act("submissions", item.id, "review", { decision, ...(note ? { note } : {}) })} />}
              <LinkAccount busy={submissions.busy || submissions.loading} onLink={(email) => act("submissions", item.id, "link", { email })} />
              <button type="button" className="mt-4 text-sm font-bold text-red-700 underline" disabled={submissions.busy} onClick={() => void deleteSubmission(item)}>Delete submission metadata</button>
            </article>
          ))}
          {!submissions.loading && !submissions.error && submissions.items.length === 0 && <p className="rounded-2xl bg-surface px-5 py-8 text-center text-muted lg:col-span-2">No pet submissions.</p>}
        </div>
      </div>

      <div className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-serif text-2xl text-forest">Pet edit requests ({edits.items.length})</h3>
          <button className="button button-outline disabled:opacity-50" disabled={edits.loading || edits.busy} onClick={() => void loadEdits()}>Refresh edit requests</button>
        </div>
        {edits.loading && <p className="mt-3" role="status">Loading edit requests…</p>}
        {edits.error && <p className="status-error mt-3 rounded-xl px-4 py-3 text-sm" role="alert">{edits.error}</p>}
        {edits.message && <p className="mt-3 text-sm" role="status">{edits.message}</p>}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {edits.items.map((item) => (
            <article key={item.id} className="rounded-2xl bg-surface p-5 shadow-sm">
              <h4 className="font-serif text-xl text-forest">{item.kind === "republish" ? "Republication" : "Edit"} request · {item.status}</h4>
              <Details fields={[["Request ID", item.id], ["Pet ID", item.petId], ["Caretaker ID", item.caretakerId], ["Created", item.createdAt], ["Previous review note", item.reviewNote]]} />
              <h5 className="mt-4 font-bold text-forest">Requested changes</h5>
              <Details fields={Object.entries(item.details).filter(([key]) => key !== "images")} />
              {item.details.images && <div className="mt-3 text-sm"><p className="font-bold text-forest">Images</p><Images images={item.details.images} /></div>}
              {item.status === "pending" && <ReviewActions busy={edits.busy || edits.loading} decisions={[{ value: "approve", label: "Approve" }, { value: "reject", label: "Reject" }]} onReview={(decision, note) => act("pet-edits", item.id, "review", { decision, ...(note ? { note } : {}) })} />}
              {item.kind === "republish" && item.status === "approved" && <button className="button button-outline mt-4" disabled={edits.busy || edits.loading} onClick={() => void republish(item)}>Republish pet</button>}
            </article>
          ))}
          {!edits.loading && !edits.error && edits.items.length === 0 && <p className="rounded-2xl bg-surface px-5 py-8 text-center text-muted lg:col-span-2">No pet edit requests.</p>}
        </div>
        <div className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-serif text-2xl text-forest">Account link requests ({claims.items.length})</h3>
            <button className="button button-outline" disabled={claims.loading || claims.busy} onClick={() => void loadClaims()}>Refresh requests</button>
          </div>
          <p className="mt-2 text-sm text-muted">Verify identity offline, then use the matching submission&apos;s link form above. Resolving a request does not link an account.</p>
          {claims.loading && <p className="mt-3" role="status">Loading requests…</p>}
          {claims.error && <p className="status-error mt-3 rounded-xl px-4 py-3 text-sm" role="alert">{claims.error}</p>}
          {claims.message && <p className="mt-3 text-sm" role="status">{claims.message}</p>}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {claims.items.map((claim) => <article key={claim.id} className="rounded-2xl bg-surface p-5 shadow-sm">
              <h4 className="font-serif text-xl text-forest">Link request · {claim.status}</h4>
              <Details fields={[["Submission ID", claim.submissionId], ["Account email", claim.email], ["Caretaker ID", claim.caretakerId], ["Created", claim.createdAt], ["Review note", claim.reviewNote]]} />
              {claim.status === "pending" && <ReviewActions busy={claims.busy || claims.loading} decisions={[{ value: "resolve", label: "Mark resolved" }, { value: "reject", label: "Reject" }]} onReview={(decision, note) => reviewClaim(claim.id, decision, note)} />}
            </article>)}
            {!claims.loading && !claims.error && claims.items.length === 0 && <p className="rounded-2xl bg-surface px-5 py-8 text-center text-muted lg:col-span-2">No link requests.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
