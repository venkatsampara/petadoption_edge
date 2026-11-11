import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnalyticsEventOnMount } from "@/components/analytics-tracking";
import { BreadcrumbJsonLd, JsonLd } from "@/components/json-ld";
import { RelatedContent } from "@/components/related-content";
import { getGuideArticle, guideArticles } from "@/lib/seo-content";
import { getSiteUrl } from "@/lib/site-url";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return guideArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getGuideArticle(params.slug);
  if (!article) return {};
  return {
    title: { absolute: `${article.title} | Hyderabad Paws` },
    description: article.description,
    alternates: { canonical: `/pet-adoption-guide/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      url: `/pet-adoption-guide/${article.slug}`,
    },
    twitter: {
      card: "summary",
      title: article.title,
      description: article.description,
    },
  };
}

export default function GuideArticlePage({ params }: Props) {
  const article = getGuideArticle(params.slug);
  if (!article) notFound();

  const pathname = `/pet-adoption-guide/${article.slug}`;
  const siteUrl = getSiteUrl();
  const relatedArticles = article.related
    .map((slug) => getGuideArticle(slug))
    .filter((item): item is NonNullable<typeof item> => item !== undefined);
  const relatedCategories = article.related.filter((slug) => !getGuideArticle(slug));

  return (
    <article className="public-theme page-shell max-w-5xl pb-16 pt-10 sm:pt-14">
      <AnalyticsEventOnMount event="view_adoption_guide" parameters={{ slug: article.slug }} />
      <BreadcrumbJsonLd items={[
        { name: "Home", path: "/" },
        { name: "Pet adoption guide", path: "/pet-adoption-guide" },
        { name: article.title, path: pathname },
      ]} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.h1,
        description: article.description,
        mainEntityOfPage: { "@type": "WebPage", "@id": `${siteUrl}${pathname}` },
        author: { "@type": "Organization", name: "Hyderabad Paws", url: siteUrl },
        publisher: { "@type": "Organization", name: "Hyderabad Paws", url: siteUrl },
        inLanguage: "en-IN",
      }} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link className="hover:text-forest" href="/">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link className="hover:text-forest" href="/pet-adoption-guide">Pet adoption guide</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold text-forest">{article.title}</li>
        </ol>
      </nav>
      <header className="mt-8 max-w-4xl">
        <p className="eyebrow">Hyderabad Paws knowledge centre</p>
        <h1 className="fluid-title mt-3 font-serif font-semibold text-forest">{article.h1}</h1>
        <p className="mt-5 text-base leading-8 text-muted">{article.intro}</p>
      </header>
      <div className="mt-10 max-w-4xl">
        {article.sections.map((section) => (
          <section key={section.title} className="mt-10">
            <h2 className="font-serif text-2xl text-forest sm:text-3xl">{section.title}</h2>
            {section.paragraphs?.map((paragraph) => (
              <ContentParagraph key={paragraph} text={paragraph} />
            ))}
            {section.bullets && (
              <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-muted">
                {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
            )}
          </section>
        ))}
        {article.references && (
          <section className="mt-10 border-t border-forest/10 pt-6" aria-labelledby="references-heading">
            <h2 id="references-heading" className="font-serif text-xl text-forest">Further reading</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-muted">
              {article.references.map((reference) => (
                <li key={reference.href}>
                  <a href={reference.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-forest underline decoration-amber decoration-2 underline-offset-4">
                    {reference.label} (opens in a new tab)
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <section className="mt-12 rounded-3xl bg-forest-strong p-6 text-white sm:p-8">
        <h2 className="font-serif text-2xl">Take the next step when you’re ready</h2>
        <p className="mt-2 max-w-3xl leading-7 text-white/80">Browse real pet profiles shared by Hyderabad caregivers, then contact the listed caregiver to discuss a suitable match.</p>
        <Link href="/adopt" className="button mt-5 border-white bg-surface text-forest hover:bg-canvas">Explore available pets</Link>
      </section>
      <RelatedContent hrefs={relatedCategories.length > 0 ? ["dogs", "cats", "guide"] : ["dogs", "cats"]} />
      {relatedArticles.length > 0 && (
        <section className="mt-10" aria-labelledby="related-guides-heading">
          <h2 id="related-guides-heading" className="font-serif text-2xl text-forest">Related guides</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {relatedArticles.map((related) => (
              <li key={related.slug}>
                <Link href={`/pet-adoption-guide/${related.slug}`} className="inline-flex min-h-11 items-center font-semibold text-forest underline decoration-amber decoration-2 underline-offset-4">
                  {related.h1}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
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
