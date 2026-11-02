import type { Metadata } from "next";
import { AdminPetForm } from "@/components/admin-pet-form";
import { BreadcrumbJsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "Add Pet",
  description: "Create a Hyderabad Paws adoptable pet profile.",
  alternates: { canonical: "/admin/pets/new" },
  robots: { index: false, follow: false },
};

export default function NewPetPage() {
  return <><BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Admin", path: "/admin" }, { name: "Add pet", path: "/admin/pets/new" }]} /><AdminPetForm /></>;
}
