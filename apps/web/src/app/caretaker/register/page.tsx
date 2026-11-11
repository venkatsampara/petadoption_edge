import type { Metadata } from "next";
import { CaretakerAuthForm } from "@/components/caretaker-auth-form";

export const metadata: Metadata = {
  title: "Create a Caretaker Account",
  robots: { index: false, follow: false },
};

export default function CaretakerRegisterPage() {
  return <CaretakerAuthForm mode="register" />;
}
