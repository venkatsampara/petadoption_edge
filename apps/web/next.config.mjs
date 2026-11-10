import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  // Compile the shared Zod schemas from source so the build never depends on
  // packages/shared/dist or on the workspace symlink being present.
  transpilePackages: ["@hyderabad-paws/shared"],
  experimental: { externalDir: true },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@hyderabad-paws/shared": path.resolve(here, "../../packages/shared/src/index.ts"),
      zod: path.resolve(here, "node_modules/zod"),
    };
    return config;
  },
};

export default nextConfig;
