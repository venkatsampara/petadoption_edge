# Hyderabad Paws

A Hyderabad-first pet adoption platform connecting adopters with local shelters and independent rescuers. This pnpm monorepo contains a Next.js web app, an Express API, shared Zod schemas, and a Neon Postgres database.

## Repository structure

```text
apps/
  api/       Express REST API, Drizzle schema/migrations, seed script
  web/       Next.js App Router frontend
packages/
  shared/    Zod schemas shared by the API and web forms
```

## Requirements

- Node.js 20+
- Corepack and pnpm 9
- A Neon Postgres project (free plan is sufficient)

## Local setup

1. Install dependencies from the repository root:

   ```sh
   corepack enable
   corepack pnpm install
   ```

2. Copy `apps/api/.env.example` to `apps/api/.env`, then set the required API values:

   - `DATABASE_URL`: Neon pooled connection string (`-pooler` in the hostname) with `sslmode=require`
   - `JWT_SECRET`: at least 32 random characters
   - `ADMIN_USERNAME` and `ADMIN_PASSWORD`: initial admin login (password at least 12 characters; `ADMIN_EMAIL` is still accepted as a fallback)
   - `NEXT_PUBLIC_SITE_URL` and `CORS_ORIGIN`: local web origin, normally `http://localhost:3000`

3. Copy `apps/web/.env.example` to `apps/web/.env.local`. Set:

   ```dotenv
   NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

   Cloudinary values can remain empty; pet photos can be supplied as public image URLs. To enable the admin uploader, set both Cloudinary values and the matching `NEXT_PUBLIC_CLOUDINARY_*` variables in the web environment.

4. Create/update the database schema and seed the initial pets and administrator:

   ```sh
   corepack pnpm db:push
   corepack pnpm db:seed
   ```

   `db:seed` is safe to rerun: the 12 pet profiles are upserted by slug and the admin password is refreshed for the configured email.

5. In separate terminals, start the API and web app:

   ```sh
   corepack pnpm dev:api
   corepack pnpm dev:web
   ```

   The API health check is `http://localhost:4000/api/v1/health`. The site is `http://localhost:3000`.

## Neon setup

1. Create a Neon project in the free plan and select a nearby region.
2. Open **Connect**, keep connection pooling enabled, and copy the Postgres connection string.
3. Store the URL only in `apps/api/.env` as `DATABASE_URL`. Confirm the hostname contains `-pooler` and the URL includes `sslmode=require`.
4. Apply the Drizzle schema with `corepack pnpm db:push`, then seed with `corepack pnpm db:seed`.

Never put `DATABASE_URL`, `JWT_SECRET`, or the admin password in frontend environment variables or commit them to Git.

## Deploy API to Render

Create a **Web Service** from this repository:

- Root directory: leave **empty** (repository root), so the whole pnpm workspace is installed
- Build command: `pnpm install --frozen-lockfile --prod=false && pnpm --filter api build && pnpm --filter api db:push`
- Start command: `node apps/api/dist/index.js`
- Health check path: `/api/v1/health`

Set these Render environment variables:

- `DATABASE_URL` — Neon pooled URL, including `sslmode=require`
- `JWT_SECRET` — strong random secret, 32+ characters
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_SITE_URL` — the deployed Vercel site origin
- `CORS_ORIGIN` — same deployed Vercel site origin
- `NODE_ENV=production`

The API listens on Render’s `PORT` environment variable. The build must run from the repository root: `@hyderabad-paws/shared` (which needs `zod`) is a workspace package, and `--prod=false` keeps TypeScript and `drizzle-kit` installed even though `NODE_ENV=production`. `pnpm --filter api build` already builds the shared package first.

## Deploy web to Vercel

Import the repository into Vercel and set **Root Directory** to `apps/web`. Leave "Include source files outside of the Root Directory" enabled (default). The web app compiles `packages/shared` directly from source (see `next.config.mjs`), so no separate shared build step is needed.

Set these Vercel environment variables:

- `NEXT_PUBLIC_API_URL` — Render API origin with `/api/v1`, for example `https://your-api.onrender.com/api/v1`
- `NEXT_PUBLIC_SITE_URL` — Vercel production site origin
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` — optional, for direct admin image uploads
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` — optional unsigned preset for the cloud above

Set the same Cloudinary cloud name and upload preset in the API environment if you keep those optional documented keys there. The unsigned preset should allow only the image transformations and upload behavior required for pet profile photos.

## Environment checklist

| Variable | API / Render | Web / Vercel | Purpose |
|---|---:|---:|---|
| `DATABASE_URL` | Required | Never | Neon pooled PostgreSQL connection |
| `JWT_SECRET` | Required | Never | Signs admin session tokens |
| `ADMIN_USERNAME` | Required for seed | Never | Initial admin login username |
| `ADMIN_PASSWORD` | Required for seed | Never | Initial admin password |
| `NEXT_PUBLIC_API_URL` | No | Required | Browser/server REST API base URL |
| `NEXT_PUBLIC_SITE_URL` | Required | Required | Canonical URL, metadata, and CORS allowlist |
| `CORS_ORIGIN` | Required | No | Allowed production site origin |
| `CLOUDINARY_CLOUD_NAME` | Optional | No | Cloudinary cloud name |
| `CLOUDINARY_UPLOAD_PRESET` | Optional | No | Cloudinary unsigned upload preset |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | No | Optional | Admin upload widget cloud |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | No | Optional | Admin upload widget preset |

## Deploy day

1. In Neon, open the Hyderabad Paws project and copy the pooled connection string. Keep it private.
2. In Render, create the API web service, set the build/start commands above, add the API environment variables, and deploy. Wait for `/api/v1/health` to return `db: true`.
3. In the API service shell or a trusted local terminal with the same API environment, run `corepack pnpm --filter api db:seed` once to create the admin user and initial pet profiles.
4. In Vercel, import the repository, set the root directory to `apps/web`, add the web environment variables, and deploy.
5. Update Render’s `NEXT_PUBLIC_SITE_URL` and `CORS_ORIGIN` to the final Vercel production domain and redeploy the API.
6. In Vercel, trigger a redeploy so site metadata and API origins reflect the final values.
7. Open the public site, confirm pet listings and detail pages load, submit a test application, then sign in at `/admin/login` and verify the inbox.
8. Add the sitemap URL (`https://<your-site>/sitemap.xml`) to Google Search Console.

## Scope notes

- Adoption and volunteer submissions are stored in the `applications` table. Volunteer rows have no pet reference and are kept separate from adoption applications in the admin inbox.
- Pet profiles accept public image URLs. The admin also supports unsigned Cloudinary uploads when its web environment variables are configured.
- TODO: Add Telugu localization after the MVP.
