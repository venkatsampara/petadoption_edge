import type { Metadata } from "next";
import { CaretakerDashboard } from "@/components/caretaker-dashboard";

export const metadata: Metadata = {
  title: "Caretaker Dashboard",
  robots: { index: false, follow: false },
};

export default function CaretakerPage() {
  return <CaretakerDashboard />;
}
