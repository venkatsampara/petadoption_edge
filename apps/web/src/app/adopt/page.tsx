import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PetGrid } from "@/components/pet-grid";
import { PetGridSkeleton } from "@/components/pet-grid-skeleton";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { RecordPetSearch } from "@/components/record-pet-search";

export const revalidate = 300;

const baseMetadata: Metadata = {
  title: "Adopt a Dog or Cat in Hyderabad",
  description:
    "Browse dogs and cats available for adoption in Hyderabad. Filter by species, neighbourhood, and size to find your match.",
  alternates: { canonical: "/adopt" },
};

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const hasFilters = Object.values(searchParams).some(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
  return {
    ...baseMetadata,
    ...(hasFilters ? { robots: { index: false, follow: true } } : {}),
  };
}

const areas = [
  "Gachibowli",
  "Hitech City",
  "Madhapur",
  "Kondapur",
  "Banjara Hills",
  "Secunderabad",
  "Kukatpally",
  "Jubilee Hills",
  "Nallagandla",
  "Attapur",
  "Mehdipatnam",
];

export default async function AdoptPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = new URLSearchParams();
  for (const key of ["species", "area", "size", "page"]) {
    const value = searchParams[key];
    if (typeof value === "string" && value.trim()) filters.set(key, value);
  }
  filters.set("status", "available");
  filters.set("limit", "12");

  return (
    <div className="public-theme page-shell pb-16 pt-12 sm:pt-16">
      <RecordPetSearch species={readFilter(searchParams.species)} area={readFilter(searchParams.area)} size={readFilter(searchParams.size)} />
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Adopt", path: "/adopt" }]} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex items-center gap-2">
          <li><Link className="hover:text-forest" href="/">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li className="font-semibold text-forest" aria-current="page">Adopt</li>
        </ol>
      </nav>
      <div className="mt-8 max-w-3xl">
        <p className="eyebrow">A friend is waiting</p>
        <h1 className="fluid-title mt-3 font-serif font-semibold text-forest">
          Find your new best friend
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted">
          Meet dogs and cats looking for their person, right here in Hyderabad. Every profile comes from a local rescue or independent rescuer.
        </p>
      </div>

      <form action="/adopt" method="get" className="mt-9 rounded-3xl border border-forest/10 bg-surface p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_1fr_auto] lg:items-end">
          <label className="field-label">
            <span>Who are you hoping to meet?</span>
            <select className="field-control" name="species" defaultValue={readFilter(searchParams.species)}>
              <option value="">All pets</option>
              <option value="dog">Dogs</option>
              <option value="cat">Cats</option>
              <option value="other">Other pets</option>
            </select>
          </label>
          <label className="field-label">
            <span>Neighbourhood</span>
            <select className="field-control" name="area" defaultValue={readFilter(searchParams.area)}>
              <option value="">All Hyderabad</option>
              {areas.map((area) => <option key={area} value={area}>{area}</option>)}
            </select>
          </label>
          <label className="field-label">
            <span>Size</span>
            <select className="field-control" name="size" defaultValue={readFilter(searchParams.size)}>
              <option value="">Any size</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </label>
          <button type="submit" className="button w-full lg:w-auto">Show pets</button>
        </div>
      </form>

      <div className="mb-5 mt-10 flex items-center justify-between">
        <h2 className="font-serif text-2xl text-forest">Pets looking for a home</h2>
        <Link href="/adopt" className="inline-flex min-h-11 items-center text-sm font-bold text-forest underline decoration-amber decoration-2 underline-offset-4">
          Clear filters
        </Link>
      </div>
      <Suspense fallback={<PetGridSkeleton />}>
        <PetGrid filters={filters} />
      </Suspense>
    </div>
  );
}

function readFilter(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}
