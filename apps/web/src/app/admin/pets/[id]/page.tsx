import type { Metadata } from "next";
import { AdminPetForm } from "@/components/admin-pet-form";
import { BreadcrumbJsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "Edit Pet",
  description: "Update a Hyderabad Paws pet profile.",
  robots: { index: false, follow: false },
};

export default function EditPetPage({ params }: { params: { id: string } }) {
  return <><BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Admin", path: "/admin" }, { name: "Edit pet", path: `/admin/pets/${params.id}` }]} /><AdminPetForm petId={params.id} /></>;
}
