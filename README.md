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

   Cloudinary values can remain empty; admins can supply public image URLs. Public submissions and caretaker edits accept only image URLs from the configured Cloudinary cloud; without the API's cloud name they must omit photos. To enable the admin uploader, set both Cloudinary values and the matching `NEXT_PUBLIC_CLOUDINARY_*` variables in the web environment.

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
- `CORS_ORIGIN` — same deployed Vercel site origin (e.g. `https://petadoption-edge-zeta.vercel.app`, no path). Multiple origins can be comma-separated. The API allows `CORS_ORIGIN`, `NEXT_PUBLIC_SITE_URL` and `http://localhost:3000`; any other origin gets a 403.
- `NODE_ENV=production`

The API listens on Render’s `PORT` environment variable. The build must run from the repository root: `@hyderabad-paws/shared` (which needs `zod`) is a workspace package, and `--prod=false` keeps TypeScript and `drizzle-kit` installed even though `NODE_ENV=production`. `pnpm --filter api build` already builds the shared package first.

## Deploy web to Vercel

Import the repository into Vercel and set **Root Directory** to `apps/web`. Leave "Include source files outside of the Root Directory" enabled (default). The web app compiles `packages/shared` directly from source (see `next.config.mjs`), so no separate shared build step is needed.

Set these Vercel environment variables:

- `NEXT_PUBLIC_API_URL` — Render API origin with `/api/v1`, for example `https://your-api.onrender.com/api/v1`
- `NEXT_PUBLIC_SITE_URL` — `https://hyderabadpaws.in` for the Vercel Production environment (no path or trailing slash); set a separate origin for Preview if needed. Redeploy after changing it because Next.js embeds public environment variables at build time.
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` — optional, for direct admin image uploads
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` — optional unsigned preset for the cloud above

Set the same Cloudinary cloud name and upload preset in the API environment if you keep those optional documented keys there. The unsigned preset should allow only the image transformations and upload behavior required for pet profile photos.

The Vercel build does not need the Render API to be awake: API-backed pages and the pet sitemap render on demand without caching pet data. Server-side API requests time out after 12 seconds so a cold or unreachable API produces the page's retry/fallback state instead of stalling a build or request indefinitely.

Canonical URLs, sitemap entries, robots metadata, and structured data use the same site origin. Vercel Production falls back to `https://hyderabadpaws.in` if `NEXT_PUBLIC_SITE_URL` is unset or points to localhost; a localhost setting also produces a build warning and should be corrected in Vercel. Local development continues to use `http://localhost:3000`.

Google Tag Manager container `GTM-P3GJZBJG` loads after the site becomes interactive, including on admin pages. Configure and publish the desired tags, consent settings, and single-page navigation tracking in the container; the site does not configure a Google Analytics property or send custom events itself. Do not configure tags to collect form entries or other personal information.

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

- Pet submissions use `/post-a-pet` without requiring an account. Submission details are private to administrators until reviewed and approved. Optional photo URLs must belong to the API's configured Cloudinary cloud; public file uploads are not supported. Such externally hosted images may already be public. WhatsApp numbers are public only when explicitly supplied with consent.
- Save the submission reference, create a caretaker account at `/caretaker/register`, and request an account link at `/caretaker`. An administrator must verify identity outside the app and use the submission's link form; matching email addresses or resolving a claim alone does not grant access. To recover access without an automated reset, create a new account and request reassignment using the reference. The administrator must arrange clarification and verification outside the app.
- Caretakers can view linked pets, review outcomes, and private adoption enquiries at `/caretaker`. Enquiries remain in the admin inbox and become visible to the linked caretaker. Profile changes require review; the published profile remains unchanged until approval. A caretaker can hide a listing or mark it adopted immediately. Republishing requires a caretaker request, admin review, and the admin's separate republish action. Check both dashboards for updates: there are no email notifications.
- Admin and caretaker sessions use secure cookies in production. If the web and API are on different sites, browsers that block third-party cookies can prevent sign-in; use a same-site API deployment or reverse proxy and test the deployed setup.
- Administrators can delete submission metadata and its claims from moderation; this does not delete a published pet or externally hosted Cloudinary assets. Establish retention, deletion and identity-verification procedures before deployment. API request limits are process-local, not shared across instances. Pet listings and generated Open Graph responses are requested without caching, but external search engines and social platforms may retain previously seen content.
- `corepack pnpm db:push` must be run for an existing database before deploying the updated API, to add the submission, caretaker-account and review tables. Back up the database before applying schema changes and follow your deployment's migration policy.
- Pet recommendations use up to five recent species, size, and neighbourhood searches saved in the visitor's browser. The most recently selected neighbourhood is used as the location; the app does not request device location. Visitors can clear saved searches from the recommendations box. Available pets matching the searched species are selected by neighbourhood and size relevance, then ordered by their number of adoption enquiries; without a species search, the current pet's species is used. Fewer than five may appear when matching pets are limited. The API receives the preference filters to find matches, but does not store the search history.
- Admins can add an optional Indian WhatsApp mobile number to each pet profile after obtaining the owner or caretaker's permission. The number is public through the pet API and the chat link. Removing it hides the link; available pets with a valid number show a WhatsApp button with a suggested, unsent message. WhatsApp must be installed or available on the user's device.
- After updating an existing installation, run `corepack pnpm db:push` before starting the updated API to add the nullable `whatsapp_number` column. Existing profiles have no number until an admin adds one.
- Adoption and volunteer submissions are stored in the `applications` table. Volunteer rows have no pet reference and are kept separate from adoption applications in the admin inbox.
- Pet profiles accept public image URLs. The admin also supports unsigned Cloudinary uploads when its web environment variables are configured.
- TODO: Add Telugu localization after the MVP.
