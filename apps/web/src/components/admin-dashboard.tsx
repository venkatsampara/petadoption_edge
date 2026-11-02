"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminApi, AdminApiError, type AdminApplication } from "@/lib/admin-api";
import type { Pet } from "@/lib/types";

type AdminUser = { id: string; email: string };

export function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [me, allPets, allApplications] = await Promise.all([
          adminApi<AdminUser>("/auth/me"),
          adminApi<Pet[]>("/admin/pets"),
          adminApi<AdminApplication[]>("/admin/applications"),
        ]);
        if (!active) return;
        setUser(me);
        setPets(allPets);
        setApplications(allApplications);
      } catch (reason) {
        if (!active) return;
        if (reason instanceof AdminApiError && reason.status === 401) {
          router.replace("/admin/login");
          return;
        }
        setError(reason instanceof Error ? reason.message : "Could not load admin data.");
      }
    }
    void load();
    return () => { active = false; };
  }, [router]);

  async function logout() {
    try {
      await adminApi("/auth/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign out.");
    }
  }

  async function togglePetStatus(pet: Pet) {
    setBusyId(pet.id);
    setError("");
    try {
      const updated = await adminApi<Pet>(`/admin/pets/${pet.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: pet.status === "available" ? "pending" : "available" }),
      });
      setPets((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update pet status.");
    } finally {
      setBusyId("");
    }
  }

  async function removePet(pet: Pet) {
    if (!window.confirm(`Permanently delete ${pet.name} and its applications?`)) return;
    setBusyId(pet.id);
    setError("");
    try {
      await adminApi(`/admin/pets/${pet.id}`, { method: "DELETE" });
      setPets((current) => current.filter((item) => item.id !== pet.id));
      setApplications((current) => current.filter((item) => item.petId !== pet.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete pet.");
    } finally {
      setBusyId("");
    }
  }

  async function updateApplication(application: AdminApplication, status: AdminApplication["status"]) {
    setBusyId(application.id);
    setError("");
    try {
      const updated = await adminApi<AdminApplication>(`/admin/applications/${application.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setApplications((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update application.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="page-shell pb-16 pt-10">
      <header className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="eyebrow">Rescue team workspace</p>
          <h1 className="mt-2 font-serif text-4xl text-forest">Admin dashboard</h1>
          {user && <p className="mt-2 text-sm text-muted">Signed in as {user.email}</p>}
        </div>
        <div className="flex gap-3">
          <Link className="button" href="/admin/pets/new">Add a pet</Link>
          <button className="button button-outline" onClick={logout}>Sign out</button>
        </div>
      </header>
      {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      <section className="mt-10" aria-labelledby="admin-pets-heading">
        <div className="flex items-center justify-between gap-4">
          <h2 id="admin-pets-heading" className="font-serif text-3xl text-forest">Pet profiles <span className="text-lg text-muted">({pets.length})</span></h2>
          <Link className="font-bold text-forest underline decoration-amber underline-offset-4" href="/admin/pets/new">Add profile</Link>
        </div>
        <div className="mt-5 overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-[#E9F0EA] text-xs uppercase tracking-wide text-forest"><tr><th className="px-5 py-4">Pet</th><th className="px-5 py-4">Area</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-forest/10">
              {pets.map((pet) => (
                <tr key={pet.id}>
                  <td className="px-5 py-4"><span className="font-bold">{pet.name}</span><span className="block text-xs capitalize text-muted">{pet.species} · {pet.breed ?? "Mixed breed"}</span></td>
                  <td className="px-5 py-4">{pet.area}</td>
                  <td className="px-5 py-4"><span className="rounded-full bg-[#E9F0EA] px-3 py-1 text-xs font-bold capitalize text-forest">{pet.status}</span></td>
                  <td className="px-5 py-4"><div className="flex gap-3"><Link className="font-bold text-forest underline" href={`/admin/pets/${pet.id}`}>Edit</Link><button className="font-bold text-forest underline disabled:opacity-50" onClick={() => void togglePetStatus(pet)} disabled={busyId === pet.id}>{pet.status === "available" ? "Mark pending" : "Mark available"}</button><button className="font-bold text-red-700 underline disabled:opacity-50" onClick={() => void removePet(pet)} disabled={busyId === pet.id}>Delete</button></div></td>
                </tr>
              ))}
              {pets.length === 0 && <tr><td className="px-5 py-8 text-center text-muted" colSpan={4}>No pet profiles yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-14" aria-labelledby="applications-heading">
        <h2 id="applications-heading" className="font-serif text-3xl text-forest">Adoption applications <span className="text-lg text-muted">({applications.length})</span></h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {applications.map((application) => (
            <article key={application.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-xl text-forest">{application.applicantName}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {application.pet
                      ? <>For <Link className="font-bold text-forest underline" href={`/pets/${application.pet.slug}`}>{application.pet.name}</Link></>
                      : <span className="font-semibold text-forest">Volunteer interest · {application.housingType}</span>}
                    {" · "}{application.area}
                  </p>
                </div>
                <span className="rounded-full bg-[#E9F0EA] px-3 py-1 text-xs font-bold capitalize text-forest">{application.status}</span>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-ink">{application.message}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-forest/10 pt-4 text-sm">
                <div><a className="font-bold text-forest underline" href={`mailto:${application.email}`}>{application.email}</a><p className="mt-1">{application.phone}</p></div>
                <label className="field-label"><span className="sr-only">Application status</span><select className="field-control py-2" value={application.status} disabled={busyId === application.id} onChange={(event) => void updateApplication(application, event.target.value as AdminApplication["status"])}><option value="new">New</option><option value="reviewing">Reviewing</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label>
              </div>
            </article>
          ))}
          {applications.length === 0 && <p className="rounded-2xl bg-white px-5 py-8 text-center text-muted lg:col-span-2">No adoption applications received yet.</p>}
        </div>
      </section>
    </div>
  );
}
