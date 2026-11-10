import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PetGrid } from "@/components/pet-grid";
import { BreadcrumbJsonLd, JsonLd } from "@/components/json-ld";
import { getLocality } from "@/lib/localities";
import { RecordPetSearch } from "@/components/record-pet-search";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: { area: string };
}): Promise<Metadata> {
  const locality = getLocality(params.area);
  if (!locality) return {};
  return {
    title: locality.title,
    description: locality.description,
    alternates: { canonical: `/adopt-in/${locality.slug}` },
    openGraph: { title: locality.title, description: locality.description },
  };
}

export default function LocalityPage({ params }: { params: { area: string } }) {
  const locality = getLocality(params.area);
  if (!locality) notFound();

  const filters = new URLSearchParams({
    area: locality.name,
    status: "available",
    limit: "12",
  });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <div className="public-theme page-shell pb-16 pt-12 sm:pt-16">
      <RecordPetSearch area={locality.name} />
      <BreadcrumbJsonLd items={[
        { name: "Home", path: "/" },
        { name: "Adopt", path: "/adopt" },
        { name: `Adopt in ${locality.name}`, path: `/adopt-in/${locality.slug}` },
      ]} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "Hyderabad Paws",
        url: `${siteUrl}/adopt-in/${locality.slug}`,
        description: locality.description,
        address: { "@type": "PostalAddress", addressLocality: "Hyderabad", addressRegion: "Telangana", addressCountry: "IN" },
        areaServed: { "@type": "Place", name: `${locality.name}, Hyderabad` },
      }} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex items-center gap-2">
          <li><Link className="hover:text-forest" href="/">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link className="hover:text-forest" href="/adopt">Adopt</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold text-forest">{locality.name}</li>
        </ol>
      </nav>
      <header className="mt-9 max-w-4xl">
        <p className="eyebrow">Hyderabad adoption guide</p>
        <h1 className="fluid-title mt-3 font-serif font-semibold text-forest">
          Adopt a pet in {locality.name}
        </h1>
        <p className="mt-5 text-base leading-8 text-muted">{locality.intro}</p>
      </header>
      <section className="mt-12" aria-labelledby="local-pets-heading">
        <p className="eyebrow">{locality.name} and nearby</p>
        <h2 id="local-pets-heading" className="mt-2 font-serif text-3xl text-forest">Pets waiting for a home</h2>
        <div className="mt-7"><PetGrid filters={filters} basePath={`/adopt-in/${locality.slug}`} /></div>
      </section>
    </div>
  );
}
