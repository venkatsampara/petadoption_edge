import type { Metadata } from "next";
import Link from "next/link";
import { HeartHandshake, Home, PawPrint, ShieldCheck } from "lucide-react";
import { BreadcrumbJsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "About — Local Pet Adoption, Led by Care",
  description:
    "Learn how Hyderabad Paws connects local shelters and independent rescuers with adopters for thoughtful, lifelong matches.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="page-shell pb-16 pt-12 sm:pt-16">
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "About", path: "/about" }]} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex items-center gap-2"><li><Link href="/">Home</Link></li><li aria-hidden="true">/</li><li aria-current="page" className="font-semibold text-forest">About</li></ol>
      </nav>
      <section className="mx-auto max-w-4xl py-12 text-center sm:py-20">
        <p className="eyebrow">A local connection with a lot of heart</p>
        <h1 className="mt-4 font-serif text-5xl font-semibold leading-tight text-forest sm:text-6xl">More good matches. More happy tails.</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted">
          Hyderabad Paws helps people meet adoptable pets cared for by shelters and independent rescuers across Hyderabad. Our purpose is simple: make it easier to find one another and begin a thoughtful adoption conversation.
        </p>
      </section>
      <section className="grid gap-5 md:grid-cols-3" aria-label="Our commitments">
        <Commitment icon={PawPrint} title="Rescue-led profiles" body="Pet details come from the people currently caring for them. Ask the rescue about routines, health, and the kind of home where each pet will thrive." />
        <Commitment icon={HeartHandshake} title="A thoughtful process" body="Adoption is a relationship, not a transaction. Applicants and rescuers can talk through a pet’s needs and what daily life together may look like." />
        <Commitment icon={ShieldCheck} title="Honest information" body="We share the profile information provided to us and encourage adopters to meet the pet and confirm health and care details with the rescue." />
      </section>
      <section className="mt-16 rounded-3xl bg-[#E9F0EA] px-7 py-9 sm:px-12 sm:py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-serif text-3xl text-forest">A better city for pets begins nearby.</h2>
            <p className="mt-3 leading-7 text-muted">Whether you’re ready to adopt or have a little time to give, there’s a kind next step.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/adopt" className="button"><Home size={17} aria-hidden="true" /> Meet pets</Link>
            <Link href="/volunteer" className="button button-outline">Volunteer</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Commitment({ icon: Icon, title, body }: { icon: typeof PawPrint; title: string; body: string }) {
  return (
    <article className="rounded-3xl bg-white p-7 shadow-card">
      <span className="grid size-12 place-items-center rounded-full bg-[#E9F0EA] text-forest"><Icon size={22} aria-hidden="true" /></span>
      <h2 className="mt-6 font-serif text-2xl text-forest">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted">{body}</p>
    </article>
  );
}
