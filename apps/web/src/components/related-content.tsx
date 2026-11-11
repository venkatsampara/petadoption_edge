import Link from "next/link";

const links = {
  dogs: { href: "/dogs-for-adoption", label: "Dogs for adoption" },
  cats: { href: "/cats-for-adoption", label: "Cats for adoption" },
  indie: { href: "/indie-dogs-for-adoption", label: "Indie dog adoption" },
  puppies: { href: "/puppies-for-adoption", label: "Puppies for adoption" },
  guide: { href: "/pet-adoption-guide", label: "Pet adoption guide" },
};

export function RelatedContent({
  hrefs = ["dogs", "cats", "guide"],
}: {
  hrefs?: (keyof typeof links)[];
}) {
  return (
    <aside className="mt-14 rounded-3xl bg-soft p-6 sm:p-8" aria-labelledby="related-content-heading">
      <p className="eyebrow">Keep exploring</p>
      <h2 id="related-content-heading" className="mt-2 font-serif text-2xl text-forest">
        Helpful next steps
      </h2>
      <ul className="mt-5 flex flex-wrap gap-3">
        {hrefs.map((key) => (
          <li key={key}>
            <Link
              href={links[key].href}
              className="inline-flex min-h-11 items-center rounded-full border border-forest/20 bg-surface px-4 py-2 text-sm font-bold text-forest hover:border-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
            >
              {links[key].label}
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/adopt"
            className="inline-flex min-h-11 items-center rounded-full border border-forest/20 bg-surface px-4 py-2 text-sm font-bold text-forest hover:border-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
          >
            Browse all pets
          </Link>
        </li>
      </ul>
    </aside>
  );
}
