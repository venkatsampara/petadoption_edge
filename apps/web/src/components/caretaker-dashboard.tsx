"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { CaretakerApplication, CaretakerClaim, CaretakerPetEdit, CaretakerSubmission } from "@hyderabad-paws/shared";
import { adminApi, AdminApiError } from "@/lib/admin-api";
import type { ManagedPet as CaretakerPet } from "@/lib/types";

type CaretakerUser = { id: string; email: string };

export function CaretakerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<CaretakerUser | null>(null);
  const [pets, setPets] = useState<CaretakerPet[]>([]);
  const [applications, setApplications] = useState<CaretakerApplication[]>([]);
  const [edits, setEdits] = useState<CaretakerPetEdit[]>([]);
  const [submissions, setSubmissions] = useState<CaretakerSubmission[]>([]);
  const [claims, setClaims] = useState<CaretakerClaim[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [me, linkedPets, enquiries, petEdits, linkedSubmissions, accountClaims] = await Promise.all([
      adminApi<CaretakerUser>("/caretaker/me"),
      adminApi<CaretakerPet[]>("/caretaker/pets"),
      adminApi<CaretakerApplication[]>("/caretaker/applications"),
      adminApi<CaretakerPetEdit[]>("/caretaker/pet-edits"),
      adminApi<CaretakerSubmission[]>("/caretaker/submissions"),
      adminApi<CaretakerClaim[]>("/caretaker/claims"),
    ]);
    setUser(me);
    setPets(linkedPets);
    setApplications(enquiries);
    setEdits(petEdits);
    setSubmissions(linkedSubmissions);
    setClaims(accountClaims);
  }

  useEffect(() => {
    let active = true;
    async function initialLoad() {
      try {
        const [me, linkedPets, enquiries, petEdits, linkedSubmissions, accountClaims] = await Promise.all([
          adminApi<CaretakerUser>("/caretaker/me"),
          adminApi<CaretakerPet[]>("/caretaker/pets"),
          adminApi<CaretakerApplication[]>("/caretaker/applications"),
          adminApi<CaretakerPetEdit[]>("/caretaker/pet-edits"),
          adminApi<CaretakerSubmission[]>("/caretaker/submissions"),
          adminApi<CaretakerClaim[]>("/caretaker/claims"),
        ]);
        if (!active) return;
        setUser(me);
        setPets(linkedPets);
        setApplications(enquiries);
        setEdits(petEdits);
        setSubmissions(linkedSubmissions);
        setClaims(accountClaims);
      } catch (reason) {
        if (!active) return;
        if (reason instanceof AdminApiError && reason.status === 401) {
          router.replace("/caretaker/login");
          return;
        }
        setError(reason instanceof Error ? reason.message : "Could not load your account.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void initialLoad();
    return () => { active = false; };
  }, [router]);

  async function signOut() {
    setError("");
    try {
      await adminApi("/caretaker/logout", { method: "POST" });
      router.replace("/caretaker/login");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign out.");
    }
  }

  async function submitClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const submissionId = String(new FormData(form).get("submissionId") ?? "").trim();
    setBusy("claim");
    setError("");
    setNotice("");
    try {
      await adminApi("/caretaker/claims", { method: "POST", body: JSON.stringify({ submissionId }) });
      form.reset();
      await load();
      setNotice("Your link request was sent. An administrator must verify your identity before linking the account.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not request a link.");
    } finally {
      setBusy("");
    }
  }

  async function changeAvailability(pet: CaretakerPet, status: "hidden" | "adopted" | "request_republish") {
    if (status !== "request_republish" && !window.confirm(
      status === "hidden"
        ? `Hide ${pet.name} from public listings and stop enquiries?`
        : `Mark ${pet.name} as adopted and stop new enquiries?`,
    )) return;
    setBusy(pet.id);
    setError("");
    setNotice("");
    try {
      await adminApi(`/caretaker/pets/${pet.id}/availability`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      await load();
      setNotice(status === "request_republish"
        ? "Your request to republish has been sent for admin review."
        : `${pet.name}'s availability was updated.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update availability.");
    } finally {
      setBusy("");
    }
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>, pet: CaretakerPet) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const whatsappNumber = String(data.get("whatsappNumber") ?? "").trim();
    if (whatsappNumber && data.get("whatsappConsent") !== "on") {
      setError("Confirm that the caretaker consents to the WhatsApp number being public.");
      return;
    }
    const changes = {
      name: String(data.get("name") ?? "").trim(),
      species: String(data.get("species") ?? ""),
      area: String(data.get("area") ?? "").trim(),
      description: String(data.get("description") ?? "").trim(),
      breed: String(data.get("breed") ?? "").trim() || null,
      ageMonths: data.get("ageMonths") === "" ? null : Number(data.get("ageMonths")),
      gender: String(data.get("gender") ?? "") || null,
      size: String(data.get("size") ?? "") || null,
      vaccinated: data.get("vaccinated") === "on",
      sterilized: data.get("sterilized") === "on",
      images: String(data.get("images") ?? "").split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
      whatsappNumber: whatsappNumber || null,
      whatsappConsent: Boolean(whatsappNumber),
    };
    setBusy(pet.id);
    setError("");
    setNotice("");
    try {
      await adminApi(`/caretaker/pets/${pet.id}/edits`, {
        method: "POST",
        body: JSON.stringify(changes),
      });
      setEditing(null);
      await load();
      setNotice(`Changes for ${pet.name} were submitted for review. The published profile will remain unchanged until approved.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not submit changes.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="public-theme page-shell pb-16 pt-10">
      <header className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="eyebrow">Caretaker workspace</p>
          <h1 className="mt-2 font-serif text-4xl text-forest">Your pets and enquiries</h1>
          {user && <p className="mt-2 text-sm text-muted">Signed in as {user.email}</p>}
        </div>
        <button className="button button-outline" onClick={() => void signOut()}>Sign out</button>
      </header>
      {loading && <p className="mt-8 text-muted" role="status">Loading your account…</p>}
      {error && <p role="alert" className="status-error mt-6 rounded-xl px-4 py-3 text-sm">{error}</p>}
      {notice && <p role="status" className="mt-6 rounded-xl bg-soft px-4 py-3 text-sm text-forest">{notice}</p>}

      {!loading && (
        <>
          <section className="mt-10" aria-labelledby="caretaker-pets-heading">
            <h2 id="caretaker-pets-heading" className="font-serif text-3xl text-forest">Linked pets</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
              A Hyderabad Paws administrator must verify you and link each submission manually. Creating an account with the same email does not automatically link a pet.
            </p>
            {pets.length === 0 ? (
              <p className="mt-5 rounded-2xl bg-surface p-5 text-muted">
                No pets are linked yet. <Link href="/post-a-pet" className="font-bold text-forest underline">Submit a pet</Link> or request a link using your submission reference below.
              </p>
            ) : (
              <div className="mt-5 grid gap-5">
                {pets.map((pet) => (
                  <article key={pet.id} className="rounded-2xl bg-surface p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="font-serif text-2xl text-forest">{pet.name}</h3>
                        <p className="mt-1 text-sm capitalize text-muted">{pet.species} · {pet.area} · {pet.status}</p>
                      </div>
                      {pet.status !== "hidden" && <Link className="font-bold text-forest underline" href={`/pets/${pet.slug}`}>View profile</Link>}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button className="button button-outline" disabled={Boolean(busy)} onClick={() => setEditing(editing === pet.id ? null : pet.id)}>
                        {editing === pet.id ? "Cancel edits" : "Propose changes"}
                      </button>
                      {pet.status !== "hidden" && <button className="button button-outline" disabled={Boolean(busy)} onClick={() => void changeAvailability(pet, "hidden")}>Hide listing</button>}
                      {(pet.status === "available" || pet.status === "pending") && <button className="button button-outline" disabled={Boolean(busy)} onClick={() => void changeAvailability(pet, "adopted")}>Mark adopted</button>}
                      {(pet.status === "hidden" || pet.status === "adopted") && (
                        <button className="button button-outline" disabled={Boolean(busy)} onClick={() => void changeAvailability(pet, "request_republish")}>Request republication</button>
                      )}
                    </div>
                    {editing === pet.id && <EditPetForm pet={pet} busy={Boolean(busy)} onSubmit={(event) => void submitEdit(event, pet)} />}
                    {edits.filter((edit) => edit.petId === pet.id).map((edit) => (
                      <p key={edit.id} className="mt-3 text-sm text-muted">
                        Request {edit.id}: {edit.status}{edit.reviewNote ? ` — ${edit.reviewNote}` : ""}
                      </p>
                    ))}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="mt-14" aria-labelledby="caretaker-claims-heading">
            <h2 id="caretaker-claims-heading" className="font-serif text-3xl text-forest">Request an account link</h2>
            <p className="mt-3 text-sm leading-6 text-muted">Enter the reference shown after submitting your pet. A request never links a pet automatically; the team verifies identity separately.</p>
            <form onSubmit={submitClaim} className="mt-5 grid max-w-xl gap-3 rounded-2xl bg-surface p-5">
              <label className="field-label"><span>Submission reference</span><input className="field-control" name="submissionId" required /></label>
              <button className="button w-fit" type="submit" disabled={Boolean(busy)}>{busy === "claim" ? "Sending…" : "Request link"}</button>
            </form>
            {claims.map((claim) => <p key={claim.id} className="mt-3 break-all text-sm text-muted">Reference {claim.submissionId}: {claim.status}{claim.reviewNote ? ` — ${claim.reviewNote}` : ""}</p>)}
            {submissions.map((submission) => <p key={submission.id} className="mt-3 break-all text-sm text-muted">Submission {submission.id}: {submission.status}{submission.reviewNote ? ` — ${submission.reviewNote}` : ""}</p>)}
          </section>

          <section className="mt-14" aria-labelledby="caretaker-enquiries-heading">
            <h2 id="caretaker-enquiries-heading" className="font-serif text-3xl text-forest">Adoption enquiries</h2>
            <p className="mt-3 text-sm leading-6 text-muted">These details are private. Contact applicants only about their adoption enquiry.</p>
            {applications.length === 0 ? (
              <p className="mt-5 rounded-2xl bg-surface p-5 text-muted">No enquiries for your linked pets yet.</p>
            ) : (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {applications.map((application) => (
                  <article key={application.id} className="rounded-2xl bg-surface p-5 shadow-sm">
                    <h3 className="font-serif text-xl text-forest">{application.applicantName}</h3>
                    <p className="mt-1 text-sm text-muted">For {pets.find((pet) => pet.id === application.petId)?.name ?? "your pet"} · {application.area}</p>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-ink">{application.message}</p>
                    <p className="mt-3 text-sm text-muted">Housing: {application.housingType}</p>
                    <p className="mt-4 text-sm">
                      <a className="font-bold text-forest underline" href={`mailto:${application.email}`}>{application.email}</a>
                      <span className="block mt-1">{application.phone}</span>
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function EditPetForm({
  pet,
  busy,
  onSubmit,
}: {
  pet: CaretakerPet;
  busy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-4 rounded-2xl border border-forest/10 p-4 sm:p-5">
      <h4 className="font-serif text-xl text-forest">Propose profile changes</h4>
      <p className="text-sm leading-6 text-muted">Changes are reviewed by an administrator before they appear publicly. Availability changes use the separate buttons above.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field-label"><span>Name</span><input className="field-control" name="name" required maxLength={120} defaultValue={pet.name} /></label>
        <label className="field-label"><span>Species</span><select className="field-control" name="species" defaultValue={pet.species}><option value="dog">Dog</option><option value="cat">Cat</option><option value="other">Other</option></select></label>
        <label className="field-label"><span>Breed, if known</span><input className="field-control" name="breed" maxLength={120} defaultValue={pet.breed ?? ""} /></label>
        <label className="field-label"><span>Age in months, if known</span><input className="field-control" type="number" name="ageMonths" min="0" max="600" defaultValue={pet.ageMonths ?? ""} /></label>
        <label className="field-label"><span>Gender</span><select className="field-control" name="gender" defaultValue={pet.gender ?? ""}><option value="">Not known</option><option value="male">Male</option><option value="female">Female</option></select></label>
        <label className="field-label"><span>Size</span><select className="field-control" name="size" defaultValue={pet.size ?? ""}><option value="">Not known</option><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></label>
        <label className="field-label"><span>Neighbourhood</span><input className="field-control" name="area" required maxLength={120} defaultValue={pet.area} /></label>
        <label className="field-label"><span>Public WhatsApp number, optional</span><input className="field-control" type="tel" name="whatsappNumber" maxLength={30} defaultValue={pet.whatsappNumber ?? ""} /></label>
      </div>
      <label className="field-label"><span>Description</span><textarea className="field-control min-h-32" name="description" required maxLength={10000} defaultValue={pet.description} /></label>
      <label className="field-label"><span>Photo URLs, optional (one per line)</span><textarea className="field-control min-h-24" name="images" defaultValue={pet.images.join("\n")} /><span className="text-xs font-normal text-muted">Only supported image URLs are accepted. Images are reviewed before publication.</span></label>
      <label className="inline-flex items-start gap-2 text-sm text-forest"><input type="checkbox" name="whatsappConsent" /> I consent to the WhatsApp number above being publicly visible and receiving adoption enquiries.</label>
      <div className="flex flex-wrap gap-4">
        <label className="inline-flex items-center gap-2 text-sm text-forest"><input type="checkbox" name="vaccinated" defaultChecked={pet.vaccinated} /> Caregiver reports vaccinated</label>
        <label className="inline-flex items-center gap-2 text-sm text-forest"><input type="checkbox" name="sterilized" defaultChecked={pet.sterilized} /> Sterilized</label>
      </div>
      <button className="button w-fit" type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit changes for review"}</button>
    </form>
  );
}
