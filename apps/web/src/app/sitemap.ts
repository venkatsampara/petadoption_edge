import type { MetadataRoute } from "next";
import { getPets } from "@/lib/api";

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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const pets = [];
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
