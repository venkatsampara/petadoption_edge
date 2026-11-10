import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { ApiRequestError, getPets } from "@/lib/api";
import type { Pet } from "@/lib/types";

export const revalidate = 300;

const staticRoutes = [
  "",
  "/adopt",
  "/about",
  "/volunteer",
  "/adopt-in/gachibowli",
  "/adopt-in/hitech-city",
  "/adopt-in/madhapur",
  "/adopt-in/kondapur",
  "/adopt-in/banjara-hills",
  "/adopt-in/secunderabad",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  headers();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const pets: Pet[] = [];
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
    ...pets.map((pet) => ({
      url: new URL(`/pets/${pet.slug}`, siteUrl).toString(),
      lastModified: new Date(pet.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
