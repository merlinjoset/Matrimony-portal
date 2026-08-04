# Deploying to Render

The code lives in **two separate GitHub repos** (not a monorepo):
- `merlinjoset/BackendPortalAPI` → service `csi-api`
- `merlinjoset/MarriagePortalWeb` → service `csi-web`

Each repo has its own `render.yaml` + `Dockerfile`. The database is external (Neon).

> ⚠️ **Before you make this public**, read "Security" at the bottom. The admin API
> currently has **no authentication** and the database holds **real parish members'
> personal data** (885 names). Make **both GitHub repos private**.

## Files added (this session, uncommitted)
- `BackendPortalAPI/render.yaml`, `BackendPortalAPI/Dockerfile`, `.dockerignore`
- `MarriagePortalWeb/render.yaml`, `MarriagePortalWeb/Dockerfile`, `.dockerignore`
- `MarriagePortalWeb/next.config.ts` - `output: "standalone"`

## Steps

1. **Commit & push each repo** (confirm both repos are PRIVATE first):
   ```bash
   cd BackendPortalAPI && git add -A && git commit -m "Add contact-reveal, AGM members, Render deploy" && git push
   cd ../MarriagePortalWeb && git add -A && git commit -m "Add contact-reveal UI, Render deploy" && git push
   ```

2. **Create two Blueprints on Render.**
   Dashboard → your project → **New** → **Blueprint** → pick each repo in turn.
   Render reads each repo's `render.yaml`.

3. **Set the secret/manual env vars** (they are `sync: false` on purpose):
   - `csi-api` → `ConnectionStrings__Default` = your Neon connection string
     (from `appsettings.Development.local.json`, which is gitignored).
   - First deploy `csi-api` so you learn its URL (e.g. `https://csi-api.onrender.com`).
   - `csi-api` → `Cors__Origins__0` = the web URL, e.g. `https://csi-web.onrender.com`
   - `csi-web` → `NEXT_PUBLIC_API_URL` = `https://csi-api.onrender.com/api`
     (this is **build-time** - redeploy `csi-web` after setting it).

4. **Deploy order:** API first (so you have its URL), then set `NEXT_PUBLIC_API_URL`
   and deploy the web service. Set `Cors__Origins__0` and redeploy the API.

## Notes & caveats
- **Free plan** spins services down on idle (cold starts) and has limited build
  minutes; the .NET image build is heavy. Consider the Starter plan for the API.
- The API **auto-runs EF migrations** against Neon on startup and imports the AGM
  roster (`Data/members.json`) - idempotent, so repeat deploys are safe.
- `NEXT_PUBLIC_API_URL` is inlined into the client bundle at build time. If you
  change the API URL later, you must **rebuild** `csi-web`.
- Uploaded photos are written to the API container's local disk, which is
  **ephemeral on Render** - they vanish on redeploy. Move to object storage
  (e.g. S3/R2) before relying on uploads in production.
- If `next/image` optimization errors on missing `sharp`, add it to the web
  dependencies; startup itself is unaffected.

## Security - do not skip
The `/admin` panel and admin API are **open (no login)**. On a public URL, anyone
can list enquirers' phone numbers (`/api/interests`), create/disable admin users
(`/api/admin/users`), and approve/reject/suspend profiles. Combined with the real
885-member roster now in the database, this is a privacy exposure. Add JWT auth
(or at minimum lock down `/api/admin/*`, `/api/interests`, and the status-change
endpoints) before sharing the URL.
