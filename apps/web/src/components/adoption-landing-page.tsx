import Link from "next/link";
import { notFound } from "next/navigation";
import { AnalyticsEventOnMount } from "@/components/analytics-tracking";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { PetGrid } from "@/components/pet-grid";
import { RelatedContent } from "@/components/related-content";
import { getAdoptionCategory } from "@/lib/seo-content";

type SearchParams = Record<string, string | string[] | undefined>;

const filterKeys = ["area", "size", "gender", "breed", "minAgeMonths", "maxAgeMonths"] as const;

export function getCategoryMetadata(slug: string) {
  const category = getAdoptionCategory(slug);
  if (!category) return {};
  return {
    title: { absolute: category.title },
    description: category.description,
    alternates: { canonical: `/${category.slug}` },
    openGraph: {
      title: category.title,
      description: category.description,
      type: "website" as const,
      url: `/${category.slug}`,
    },
    twitter: {
      card: "summary" as const,
      title: category.title,
      description: category.description,
    },
  };
}

export function AdoptionLandingPage({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: SearchParams;
}) {
  const category = getAdoptionCategory(slug);
  if (!category) notFound();

  const filters = new URLSearchParams({
    species: category.species,
    status: "available",
    limit: "12",
  });
  for (const [key, value] of Object.entries(category.fixedFilters ?? {})) {
    filters.set(key, value);
  }
  for (const key of filterKeys) {
    if (key === "breed" && category.fixedFilters?.breed) continue;
    const value = singleValue(searchParams[key]);
    if (value) filters.set(key, value);
  }
  if (category.ageFilter === "puppy" || category.ageFilter === "cat") {
    const age = singleValue(searchParams.age);
    if (age === "adult") {
      filters.delete("maxAgeMonths");
      filters.set("minAgeMonths", "12");
    } else if (age === "any") {
      filters.delete("minAgeMonths");
      filters.delete("maxAgeMonths");
    } else {
      filters.delete("minAgeMonths");
      filters.set("maxAgeMonths", "11");
    }
  }

  const related = category.species === "cat"
    ? ["cats", "guide"] as const
    : category.slug === "indie-dogs-for-adoption"
      ? ["dogs", "puppies", "guide"] as const
      : ["dogs", "indie", "puppies", "guide"] as const;
  const crumbItems = [
    { name: "Home", path: "/" },
    { name: "Adopt", path: "/adopt" },
    { name: category.species === "dog" ? "Dogs" : "Cats", path: `/${category.slug}` },
  ];

  return (
    <div className="public-theme page-shell pb-16 pt-10 sm:pt-14">
      <AnalyticsEventOnMount event="view_adoption_category" parameters={{ category: category.slug }} />
      <BreadcrumbJsonLd items={crumbItems} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link className="hover:text-forest" href="/">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link className="hover:text-forest" href="/adopt">Adopt</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold text-forest">{category.species === "dog" ? "Dogs" : "Cats"}</li>
        </ol>
      </nav>
      <header className="mt-8 max-w-4xl">
        <p className="eyebrow">Hyderabad adoption listings</p>
        <h1 className="fluid-title mt-3 font-serif font-semibold text-forest">{category.h1}</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-muted">{category.intro}</p>
        <Link href="#available-pets" className="button mt-6">View available {category.species === "dog" ? "dogs" : "cats"}</Link>
      </header>

      <section id="available-pets" className="mt-14 scroll-mt-24" aria-labelledby="listing-heading">
        <p className="eyebrow">Current caregiver listings</p>
        <h2 id="listing-heading" className="mt-2 font-serif text-3xl text-forest">{category.listingTitle}</h2>
        <p className="mt-3 max-w-3xl leading-7 text-muted">{category.listingDescription}</p>
        <form action={`/${category.slug}`} method="get" aria-label={`Filter available ${category.species}s`} className="mt-7 rounded-3xl border border-forest/10 bg-surface p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {category.ageFilter && (
              category.ageFilter === "puppy" || category.ageFilter === "cat" ? (
                <label className="field-label">
                  <span>Age</span>
                  <select className="field-control" name="age" defaultValue={ageGroup(searchParams, category.ageFilter)}>
                    {category.ageFilter === "cat" ? (
                      <>
                        <option value="any">Any age</option>
                        <option value="puppy">Kitten (under 12 months)</option>
                        <option value="adult">Adult cat (12 months and older)</option>
                      </>
                    ) : (
                      <>
                        <option value="puppy">Under 12 months</option>
                        <option value="adult">12 months and older</option>
                        <option value="any">Any age</option>
                      </>
                    )}
                  </select>
                </label>
              ) : (
                <>
                  <label className="field-label">
                    <span>Minimum age (months)</span>
                    <input className="field-control" type="number" min="0" max="600" name="minAgeMonths" defaultValue={singleValue(searchParams.minAgeMonths)} />
                  </label>
                  <label className="field-label">
                    <span>Maximum age (months)</span>
                    <input className="field-control" type="number" min="0" max="600" name="maxAgeMonths" defaultValue={singleValue(searchParams.maxAgeMonths)} />
                  </label>
                </>
              )
            )}
            <label className="field-label">
              <span>Gender</span>
              <select className="field-control" name="gender" defaultValue={singleValue(searchParams.gender)}>
                <option value="">Any</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </label>
            <label className="field-label">
              <span>Size</span>
              <select className="field-control" name="size" defaultValue={singleValue(searchParams.size)}>
                <option value="">Any size</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </label>
            {category.showBreedFilter && (
              <label className="field-label">
                <span>Breed as listed</span>
                <input className="field-control" name="breed" defaultValue={singleValue(searchParams.breed)} maxLength={120} />
              </label>
            )}
            <label className="field-label">
              <span>Hyderabad neighbourhood</span>
              <input className="field-control" name="area" defaultValue={singleValue(searchParams.area)} placeholder="e.g. Gachibowli" maxLength={120} />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="submit" className="button">Filter listings</button>
            <Link href={`/${category.slug}`} className="button button-outline">Clear filters</Link>
          </div>
          {category.slug === "indie-dogs-for-adoption" && (
            <p className="mt-4 text-sm leading-6 text-muted">Breed results use the exact caregiver-provided labels “Indie” and “Indian Pariah”. Other or mixed-breed profiles are not inferred as purebred.</p>
          )}
          {(category.ageFilter === "puppy" || category.ageFilter === "cat") && (
            <p className="mt-2 text-sm leading-6 text-muted">Age is based on the listing. Profiles with unknown age cannot be included in age-based results.</p>
          )}
        </form>
        <div className="mt-8">
          <PetGrid
            filters={filters}
            basePath={`/${category.slug}`}
            emptyTitle={`No ${category.species === "dog" ? "dogs" : "cats"} match these filters right now`}
            emptyBody="Try a different filter, browse all available pets or check back as caregivers add listings."
          />
        </div>
      </section>

      {category.sections.map((section) => (
        <section key={section.title} className="mt-14 max-w-4xl">
          <h2 className="font-serif text-2xl text-forest sm:text-3xl">{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <ContentParagraph key={paragraph} text={paragraph} />
          ))}
          {section.bullets && (
            <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-muted">
              {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
            </ul>
          )}
        </section>
      ))}

      <section className="mt-14 max-w-4xl" aria-labelledby="category-faq">
        <h2 id="category-faq" className="font-serif text-2xl text-forest sm:text-3xl">Frequently asked questions</h2>
        <div className="mt-5 grid gap-4">
          {category.faqs.map((faq) => (
            <details key={faq.question} className="rounded-2xl border border-forest/10 bg-surface p-5">
              <summary className="cursor-pointer font-bold text-forest">{faq.question}</summary>
              <p className="mt-3 leading-7 text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="mt-14 flex flex-col items-start justify-between gap-5 rounded-3xl bg-forest-strong p-6 text-white sm:flex-row sm:items-center sm:p-8">
        <div>
          <h2 className="font-serif text-2xl">Ready to meet a possible match?</h2>
          <p className="mt-2 max-w-2xl leading-7 text-white/80">Open a pet profile to learn more and contact the caregiver using the options available there.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="#available-pets" className="button border-white bg-surface text-forest hover:bg-canvas">View listings</Link>
          <Link href="/volunteer" className="button border-white/60 bg-transparent text-white hover:bg-white/10">Foster or volunteer</Link>
        </div>
      </section>
      <RelatedContent hrefs={[...related]} />
    </div>
  );
}

function singleValue(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function ageGroup(searchParams: SearchParams, ageFilter: "puppy" | "cat"): string {
  const age = singleValue(searchParams.age);
  if (age) return age;
  if (singleValue(searchParams.minAgeMonths) === "12") return "adult";
  if (singleValue(searchParams.maxAgeMonths) === "11") return "puppy";
  return ageFilter === "puppy" ? "puppy" : "any";
}

function ContentParagraph({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <p className="mt-4 leading-8 text-muted">
      {parts.map((part, index) => {
        const match = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        return match
          ? <Link key={index} href={match[2]} className="font-semibold text-forest underline decoration-amber decoration-2 underline-offset-4">{match[1]}</Link>
          : part;
      })}
    </p>
  );
}
