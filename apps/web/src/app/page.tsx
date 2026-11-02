import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, HeartHandshake, Home, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { PetCard } from "@/components/pet-card";
import { Reveal } from "@/components/reveal";
import { JsonLd } from "@/components/json-ld";
import { ApiRequestError, getFeaturedPets } from "@/lib/api";
import type { Pet } from "@/lib/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Pet Adoption in Hyderabad — Find Your New Best Friend",
  description:
    "Adopt a dog or cat in Hyderabad. Meet local shelter and rescuer pets ready for a loving home.",
  alternates: { canonical: "/" },
};

const areas = ["Gachibowli", "Hitech City", "Madhapur", "Kondapur", "Banjara Hills", "Secunderabad"];

const steps = [
  {
    number: "01",
    icon: Sparkles,
    title: "Meet your match",
    body: "Browse real profiles from local shelters and independent rescuers.",
  },
  {
    number: "02",
    icon: HeartHandshake,
    title: "Start a conversation",
    body: "Tell the rescue a little about your home and the life you can offer.",
  },
  {
    number: "03",
    icon: Home,
    title: "Bring love home",
    body: "Meet your new companion and get support as you settle in together.",
  },
];

export default async function HomePage() {
  let pets: Pet[] = [];
  try {
    pets = await getFeaturedPets();
  } catch (error) {
    // Keep the build/render alive if the API is asleep; ISR refreshes this page.
    if (!(error instanceof ApiRequestError)) throw error;
  }

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/#organization`,
            name: "Hyderabad Paws",
            url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
            description: "Connecting Hyderabad adopters with local shelters and independent pet rescuers.",
          },
          {
            "@type": "LocalBusiness",
            name: "Hyderabad Paws",
            url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
            address: { "@type": "PostalAddress", addressLocality: "Hyderabad", addressRegion: "Telangana", addressCountry: "IN" },
            areaServed: { "@type": "City", name: "Hyderabad" },
          },
        ],
      }} />
      <section className="relative isolate overflow-hidden bg-[#F3EEE3]">
        <div className="page-shell grid min-h-[620px] items-center gap-10 py-14 md:grid-cols-[1.05fr_0.95fr] md:py-20">
          <div className="relative z-10">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-forest/15 bg-canvas/80 px-4 py-2 text-sm font-bold text-forest">
              <MapPin size={15} aria-hidden="true" /> Hyderabad, meet your new best friend
            </p>
            <h1 className="max-w-2xl font-serif text-5xl font-semibold leading-[1.06] tracking-tight text-forest sm:text-6xl lg:text-7xl">
              A little more love starts <span className="text-[#B97519]">right here.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#4F5B53]">
              Your next best friend is closer than you think. Meet kind, character-filled pets waiting for a home in Hyderabad.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link className="button" href="/adopt">
                Find your companion <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <span className="text-sm font-medium text-muted">Local pets. Lifelong love.</span>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-forest">
              <span className="inline-flex items-center gap-2"><ShieldCheck size={18} aria-hidden="true" /> Rescue-led matching</span>
              <span className="inline-flex items-center gap-2"><HeartHandshake size={18} aria-hidden="true" /> Adoption, not purchase</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[500px]">
            <div className="absolute -left-7 top-8 size-24 rounded-full bg-amber/35 blur-2xl" aria-hidden="true" />
            <div className="relative aspect-[4/4.2] overflow-hidden rounded-[42%_42%_28px_28px] border-[10px] border-canvas shadow-[0_28px_70px_rgba(31,78,61,0.16)]">
              <Image
                src="/pet-placeholder.svg"
                alt="Illustration of a happy rescued dog ready to meet its new family"
                fill
                priority
                sizes="(max-width: 768px) 90vw, 42vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -left-3 rounded-2xl bg-white px-5 py-4 shadow-card sm:-left-10">
              <p className="font-serif text-xl text-forest">Every pet has a story.</p>
              <p className="mt-1 text-xs text-muted">Make yours the next chapter.</p>
            </div>
            <div className="absolute right-0 top-10 rounded-full bg-amber px-4 py-2 text-sm font-extrabold text-ink shadow-lg sm:-right-5">
              Adopt local <span aria-hidden="true">♥</span>
            </div>
          </div>
        </div>
      </section>

      <Reveal>
        <section className="page-shell py-20 sm:py-24" aria-labelledby="featured-heading">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="eyebrow">Good things are waiting</p>
              <h2 id="featured-heading" className="section-title mt-3">Meet a few lovely souls</h2>
              <p className="mt-3 max-w-xl text-muted">Each one is ready for a safe, caring home in our city.</p>
            </div>
            <Link href="/adopt" className="inline-flex items-center gap-2 font-bold text-forest hover:text-[#B97519]">
              See all pets <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          {pets.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pets.slice(0, 6).map((pet) => <PetCard key={pet.id} pet={pet} />)}
            </div>
          ) : (
            <p className="rounded-2xl bg-white px-6 py-10 text-center text-muted">
              No pets are listed just yet. Please check back soon.
            </p>
          )}
        </section>
      </Reveal>

      <Reveal>
        <section className="bg-white py-20 sm:py-24" aria-labelledby="how-heading">
          <div className="page-shell">
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">Simple, thoughtful, local</p>
              <h2 id="how-heading" className="section-title mt-3">A good match, in three steps</h2>
              <p className="mt-4 leading-7 text-muted">Adoption should feel clear and kind for everyone — especially the pet.</p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {steps.map(({ number, icon: Icon, title, body }) => (
                <article key={number} className="rounded-3xl border border-forest/10 bg-canvas p-7">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-4xl text-amber">{number}</span>
                    <span className="grid size-12 place-items-center rounded-full bg-[#E9F0EA] text-forest">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                  </div>
                  <h3 className="mt-7 font-serif text-2xl text-forest">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="page-shell py-20 sm:py-24" aria-labelledby="areas-heading">
          <div className="rounded-[32px] bg-[#E9F0EA] px-6 py-10 sm:px-12 sm:py-12">
            <div className="max-w-2xl">
              <p className="eyebrow">Close to home</p>
              <h2 id="areas-heading" className="section-title mt-3">Find a friend around your neighbourhood</h2>
              <p className="mt-4 leading-7 text-muted">Meet adoptable pets across Hyderabad and start with the area that feels familiar.</p>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              {areas.map((area) => (
                <Link
                  key={area}
                  href={`/adopt?area=${encodeURIComponent(area)}`}
                  className="rounded-full border border-forest/20 bg-white px-5 py-2.5 text-sm font-bold text-forest transition hover:border-forest hover:bg-forest hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
                >
                  {area}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <section className="page-shell pb-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[32px] bg-forest px-7 py-9 text-white sm:flex-row sm:items-center sm:px-12 sm:py-12">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#F2C478]">Your home could change everything</p>
            <h2 className="mt-3 max-w-xl font-serif text-3xl leading-tight sm:text-4xl">Make room for a little more joy.</h2>
          </div>
          <Link href="/adopt" className="button border-white bg-white text-forest hover:bg-canvas">
            Meet the pets <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
