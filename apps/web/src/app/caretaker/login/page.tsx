import type { Metadata } from "next";
import { CaretakerAuthForm } from "@/components/caretaker-auth-form";

export const metadata: Metadata = {
  title: "Caretaker Sign In",
  robots: { index: false, follow: false },
};

export default function CaretakerLoginPage() {
  return <CaretakerAuthForm mode="login" />;
}
