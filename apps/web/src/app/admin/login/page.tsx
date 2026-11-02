import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin-login-form";
import { BreadcrumbJsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Secure sign-in for Hyderabad Paws rescue team administrators.",
  alternates: { canonical: "/admin/login" },
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return <><BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Admin login", path: "/admin/login" }]} /><AdminLoginForm /></>;
}
