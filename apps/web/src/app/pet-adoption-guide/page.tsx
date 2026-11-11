import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { RelatedContent } from "@/components/related-content";
import { guideArticles } from "@/lib/seo-content";

export const metadata: Metadata = {
  title: { absolute: "Pet Adoption Guide for Hyderabad | Hyderabad Paws" },
  description:
    "Practical, locally relevant guides to adopting and caring for dogs and cats in Hyderabad, from first steps to everyday wellbeing.",
  alternates: { canonical: "/pet-adoption-guide" },
  openGraph: {
    title: "Pet Adoption Guide for Hyderabad",
    description:
      "Practical guides to adopting and caring for pets in Hyderabad.",
    type: "website",
    url: "/pet-adoption-guide",
  },
  twitter: {
    card: "summary",
    title: "Pet Adoption Guide for Hyderabad",
    description: "Practical guides to adopting and caring for pets in Hyderabad.",
  },
};

const groups = [
  {
    title: "Adoption basics",
    slugs: ["adopting-a-pet-in-hyderabad", "first-30-days-after-adopting-a-dog", "first-30-days-after-adopting-a-cat"],
  },
  {
    title: "Health and seasonal care",
    slugs: ["pet-vaccination-guide-hyderabad", "pet-care-hyderabad-weather", "diwali-pet-safety"],
  },
];

export default function PetAdoptionGuidePage() {
  return (
    <div className="public-theme page-shell pb-16 pt-10 sm:pt-14">
      <BreadcrumbJsonLd items={[
        { name: "Home", path: "/" },
        { name: "Pet adoption guide", path: "/pet-adoption-guide" },
      ]} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex items-center gap-2">
          <li><Link className="hover:text-forest" href="/">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold text-forest">Pet adoption guide</li>
        </ol>
      </nav>
      <header className="mt-8 max-w-3xl">
        <p className="eyebrow">Hyderabad Paws knowledge centre</p>
        <h1 className="fluid-title mt-3 font-serif font-semibold text-forest">A practical guide to adopting and caring for pets</h1>
        <p className="mt-5 text-base leading-8 text-muted">
          Clear, useful starting points for Hyderabad adopters. Each guide is general information; ask a registered veterinarian about your individual pet’s health and care.
        </p>
      </header>
      <div className="mt-12 space-y-12">
        {groups.map((group) => (
          <section key={group.title} aria-labelledby={`group-${group.title}`}>
            <h2 id={`group-${group.title}`} className="font-serif text-2xl text-forest sm:text-3xl">{group.title}</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {group.slugs.map((slug) => {
                const article = guideArticles.find((item) => item.slug === slug);
                if (!article) return null;
                return (
                  <article key={slug} className="rounded-3xl border border-forest/10 bg-surface p-6 shadow-sm">
                    <p className="eyebrow">Hyderabad Paws guide</p>
                    <h3 className="mt-3 font-serif text-xl leading-snug text-forest">
                      <Link href={`/pet-adoption-guide/${article.slug}`} className="rounded-sm hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber">
                        {article.h1}
                      </Link>
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-muted">{article.description}</p>
                    <Link href={`/pet-adoption-guide/${article.slug}`} className="mt-5 inline-flex min-h-11 items-center font-bold text-forest underline decoration-amber decoration-2 underline-offset-4">
                      Read this guide
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <RelatedContent hrefs={["dogs", "cats", "indie", "puppies"]} />
    </div>
  );
}
