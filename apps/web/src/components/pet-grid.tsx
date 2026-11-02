import { getPets } from "@/lib/api";
import { PetCard } from "@/components/pet-card";

export async function PetGrid({
  filters,
  basePath = "/adopt",
  emptyTitle = "No pups here yet — check back soon 🐾",
  emptyBody = "Try another filter or browse all the pets looking for a home.",
}: {
  filters: URLSearchParams;
  basePath?: string;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  const result = await getPets(filters);
  if (result.items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-forest/25 bg-white/70 px-6 py-14 text-center">
        <span className="text-4xl" aria-hidden="true">🐾</span>
        <h2 className="mt-4 font-serif text-2xl text-forest">{emptyTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{emptyBody}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {result.items.map((pet) => <PetCard key={pet.id} pet={pet} />)}
      </div>
      {result.pagination.totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-4" aria-label="Pet listing pages">
          {result.pagination.page > 1 && (
            <a className="button button-outline" href={pageHref(basePath, filters, result.pagination.page - 1)}>
              Previous
            </a>
          )}
          <span className="text-sm text-muted">
            Page {result.pagination.page} of {result.pagination.totalPages}
          </span>
          {result.pagination.page < result.pagination.totalPages && (
            <a className="button button-outline" href={pageHref(basePath, filters, result.pagination.page + 1)}>
              Next
            </a>
          )}
        </nav>
      )}
    </>
  );
}

function pageHref(basePath: string, filters: URLSearchParams, page: number): string {
  const params = new URLSearchParams(filters);
  params.set("page", String(page));
  return `${basePath}?${params.toString()}`;
}
