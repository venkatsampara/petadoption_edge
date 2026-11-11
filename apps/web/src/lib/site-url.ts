const productionSiteUrl = "https://hyderabadpaws.in";
const localSiteUrl = "http://localhost:3000";

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const isProduction = process.env.VERCEL_ENV === "production";

  if (!configured) {
    return isProduction || (!process.env.VERCEL_ENV && process.env.NODE_ENV === "production")
      ? productionSiteUrl
      : localSiteUrl;
  }

  const url = new URL(configured);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin without a path, credentials, query, or fragment.");
  }

  if (isProduction && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    console.warn("NEXT_PUBLIC_SITE_URL points to localhost in Vercel production; using https://hyderabadpaws.in instead. Update the Vercel environment variable.");
    return productionSiteUrl;
  }

  return url.origin;
}
