import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { ApiRequestError, getPets } from "@/lib/api";
import { localities } from "@/lib/localities";
import { guideArticles } from "@/lib/seo-content";
import { getSiteUrl } from "@/lib/site-url";
import type { Pet } from "@/lib/types";

export const revalidate = 300;

const staticRoutes = [
  "",
  "/adopt",
  "/about",
  "/volunteer",
  "/dogs-for-adoption",
  "/cats-for-adoption",
  "/indie-dogs-for-adoption",
  "/puppies-for-adoption",
  "/pet-adoption-guide",
  ...guideArticles.map((article) => `/pet-adoption-guide/${article.slug}`),
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  headers();
  const siteUrl = getSiteUrl();
  const pets: Pet[] = [];
  let indexableLocalities: typeof localities = [];
  try {
    let page = 1;
    let totalPages = 1;
    do {
      const listing = await getPets(new URLSearchParams({
        status: "available",
        page: String(page),
        limit: "50",
      }));
      pets.push(...listing.items);
      totalPages = listing.pagination.totalPages;
      page += 1;
    } while (page <= totalPages);
    const localityResults = await Promise.all(localities.map(async (locality) => {
      try {
        const listing = await getPets(new URLSearchParams({
          area: locality.name,
          status: "available",
          page: "1",
          limit: "1",
        }));
        return listing.pagination.total > 0 ? locality : null;
      } catch (error) {
        if (error instanceof ApiRequestError) return null;
        throw error;
      }
    }));
    indexableLocalities = localityResults.filter((locality): locality is (typeof localities)[number] => locality !== null);
  } catch (error) {
    // Fall back to static routes if the API is unreachable.
    if (!(error instanceof ApiRequestError)) throw error;
  }

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: new URL(route || "/", siteUrl).toString(),
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : route.startsWith("/adopt-in/") ? 0.75 : 0.8,
  }));
  return [
    ...staticEntries,
    ...indexableLocalities.map((locality) => ({
      url: new URL(`/adopt-in/${locality.slug}`, siteUrl).toString(),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...pets.map((pet) => ({
      url: new URL(`/pets/${pet.slug}`, siteUrl).toString(),
      lastModified: new Date(pet.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
