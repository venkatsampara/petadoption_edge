"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { petInputSchema } from "@hyderabad-paws/shared";
import { adminApi, AdminApiError } from "@/lib/admin-api";
import type { Pet } from "@/lib/types";

type Props = { petId?: string };

export function AdminPetForm({ petId }: Props) {
  const router = useRouter();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(Boolean(petId));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [imagesText, setImagesText] = useState("");

  useEffect(() => {
    if (!petId) return;
    let active = true;
    adminApi<Pet[]>("/admin/pets")
      .then((items) => {
        const selected = items.find((item) => item.id === petId);
        if (!active) return;
        if (!selected) {
          setError("Pet profile not found.");
          return;
        }
        setPet(selected);
        setImagesText(selected.images.join("\n"));
      })
      .catch((reason: unknown) => {
        if (!active) return;
        if (reason instanceof AdminApiError && reason.status === 401) {
          router.replace("/admin/login");
          return;
        }
        setError(reason instanceof Error ? reason.message : "Unable to load pet profile.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [petId, router]);

  async function uploadImage(file: File) {
    setError("");
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !preset) {
      setError("Cloudinary is not configured. Add a photo URL below instead.");
      return;
    }
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", preset);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json() as { secure_url?: string; error?: { message?: string } };
      if (!response.ok || !result.secure_url) throw new Error(result.error?.message ?? "Image upload failed.");
      const uploadedUrl = result.secure_url;
      setPet((current) => current ? { ...current, images: [...current.images, uploadedUrl] } : current);
      setImagesText((current) => current ? `${current}\n${uploadedUrl}` : uploadedUrl);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Image upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const imageList = (formData.get("images")?.toString() ?? "")
      .split(/\r?\n/)
      .map((url) => url.trim())
      .filter(Boolean);
    const data = {
      slug: formData.get("slug"),
      name: formData.get("name"),
      species: formData.get("species"),
      breed: formData.get("breed") || null,
      ageMonths: formData.get("ageMonths") === "" ? null : Number(formData.get("ageMonths")),
      gender: formData.get("gender") || null,
      size: formData.get("size") || null,
      area: formData.get("area"),
      description: formData.get("description"),
      vaccinated: formData.get("vaccinated") === "on",
      sterilized: formData.get("sterilized") === "on",
      status: formData.get("status"),
      images: imageList,
    };
    const parsed = petInputSchema.safeParse(data);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the pet details.");
      return;
    }

    setBusy(true);
    try {
      await adminApi<Pet>(petId ? `/admin/pets/${petId}` : "/admin/pets", {
        method: petId ? "PATCH" : "POST",
        body: JSON.stringify(parsed.data),
      });
      router.replace("/admin");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Pet profile could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="page-shell py-16 text-muted">Loading pet profile…</p>;

  return (
    <div className="page-shell pb-16 pt-10">
      <Link href="/admin" className="font-bold text-forest underline">← Admin dashboard</Link>
      <section className="mx-auto mt-6 max-w-3xl rounded-3xl bg-white p-6 shadow-card sm:p-9">
        <p className="eyebrow">Pet profile</p>
        <h1 className="mt-2 font-serif text-4xl text-forest">{petId ? `Edit ${pet?.name ?? "pet"}` : "Add a pet"}</h1>
        <form onSubmit={submit} className="mt-7 grid gap-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="field-label"><span>Name</span><input className="field-control" name="name" required maxLength={120} defaultValue={pet?.name ?? ""} /></label>
            <label className="field-label"><span>URL slug</span><input className="field-control" name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={160} placeholder="bruno-indie-gachibowli" defaultValue={pet?.slug ?? ""} /></label>
            <label className="field-label"><span>Species</span><select className="field-control" name="species" defaultValue={pet?.species ?? "dog"}><option value="dog">Dog</option><option value="cat">Cat</option><option value="other">Other</option></select></label>
            <label className="field-label"><span>Breed</span><input className="field-control" name="breed" maxLength={120} defaultValue={pet?.breed ?? ""} /></label>
            <label className="field-label"><span>Age in months</span><input className="field-control" name="ageMonths" type="number" min="0" defaultValue={pet?.ageMonths ?? ""} /></label>
            <label className="field-label"><span>Gender</span><select className="field-control" name="gender" defaultValue={pet?.gender ?? ""}><option value="">Not listed</option><option value="male">Male</option><option value="female">Female</option></select></label>
            <label className="field-label"><span>Size</span><select className="field-control" name="size" defaultValue={pet?.size ?? ""}><option value="">Not listed</option><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></label>
            <label className="field-label"><span>Area</span><input className="field-control" name="area" required maxLength={120} defaultValue={pet?.area ?? ""} /></label>
            <label className="field-label"><span>Status</span><select className="field-control" name="status" defaultValue={pet?.status ?? "available"}><option value="available">Available</option><option value="pending">Pending</option><option value="adopted">Adopted</option></select></label>
          </div>
          <label className="field-label"><span>Description</span><textarea className="field-control min-h-32 resize-y" name="description" required maxLength={10000} defaultValue={pet?.description ?? ""} /></label>
          <div className="flex flex-wrap gap-6">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-forest"><input type="checkbox" name="vaccinated" defaultChecked={pet?.vaccinated ?? false} /> Vaccinated</label>
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-forest"><input type="checkbox" name="sterilized" defaultChecked={pet?.sterilized ?? false} /> Sterilized</label>
          </div>
          <label className="field-label"><span>Pet photos</span><input className="field-control" type="file" accept="image/*" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); }} /><span className="text-xs font-normal text-muted">Unsigned Cloudinary upload when configured, or use one public image URL per line below.</span></label>
          <label className="field-label"><span>Image URLs (one per line)</span><textarea className="field-control min-h-24 resize-y" name="images" value={imagesText} onChange={(event) => setImagesText(event.target.value)} /></label>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
          <button type="submit" className="button w-full sm:w-fit" disabled={busy}>{busy ? "Saving…" : petId ? "Save changes" : "Create pet profile"}</button>
        </form>
      </section>
    </div>
  );
}
