import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin-dashboard";
import { BreadcrumbJsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "Rescue Team Dashboard",
  description: "Manage Hyderabad Paws pet listings and adoption applications.",
  alternates: { canonical: "/admin" },
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <><BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Admin", path: "/admin" }]} /><AdminDashboard /></>;
}
