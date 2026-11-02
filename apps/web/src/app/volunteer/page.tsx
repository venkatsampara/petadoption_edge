import type { Metadata } from "next";
import Link from "next/link";
import { VolunteerForm } from "@/components/volunteer-form";
import { BreadcrumbJsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "Volunteer Opportunities in Hyderabad",
  description:
    "Help Hyderabad pets find loving homes. Share your interest in fostering, transport, photography, or meet-and-greet support.",
  alternates: { canonical: "/volunteer" },
};

export default function VolunteerPage() {
  return (
    <div className="page-shell pb-16 pt-12 sm:pt-16">
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Volunteer", path: "/volunteer" }]} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex items-center gap-2"><li><Link href="/">Home</Link></li><li aria-hidden="true">/</li><li aria-current="page" className="font-semibold text-forest">Volunteer</li></ol>
      </nav>
      <div className="mx-auto mt-9 grid max-w-5xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="eyebrow">A little help goes a long way</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-forest sm:text-5xl">Be part of a pet’s next chapter.</h1>
          <p className="mt-5 leading-7 text-muted">There are many ways to support local rescues. Tell us what interests you and where you are based; the team can follow up about suitable opportunities.</p>
          <ul className="mt-7 space-y-3 text-sm font-semibold text-forest">
            <li className="flex gap-3"><span aria-hidden="true">♥</span> Foster a pet while they wait for a home</li>
            <li className="flex gap-3"><span aria-hidden="true">♥</span> Help with local pet transport</li>
            <li className="flex gap-3"><span aria-hidden="true">♥</span> Share photos or support meet-and-greets</li>
          </ul>
        </div>
        <VolunteerForm />
      </div>
    </div>
  );
}
