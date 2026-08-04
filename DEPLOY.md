# Deploying CSI Holy Matrimony (single Next.js app)

The whole application - web UI **and** API - is one Next.js 16 project in
`MarriagePortalWeb/`. The API lives under `/api` (route handlers) and talks to the
Neon Postgres database directly. There is no separate backend service anymore.

## One Render service
- Repo: `merlinjoset/Matrimony-portal`
- Root Directory: `MarriagePortalWeb`
- Runtime: Docker (`Dockerfile` builds the Next.js standalone image)
- Health check: `/api/health`

Set this environment variable in the Render dashboard (server-side, secret):
- `DATABASE_URL` = your Neon connection string, e.g.
  `postgresql://neondb_owner:<pwd>@ep-raspy-leaf-atjdx9dz-pooler.c-9.us-east-1.aws.neon.tech/CSIPortal?sslmode=require`

That's the only service and the only required variable. The old `backendportalapi`
Render service can be deleted.

## Local dev
```bash
cd MarriagePortalWeb
# .env.local:
#   DATABASE_URL=postgresql://...neon.tech/CSIPortal?sslmode=require
node node_modules/next/dist/bin/next dev --port 3300
```
Open http://localhost:3300.

## Notes
- The old .NET API (`BackendPortalAPI`) has been **retired**. It still exists in the
  standalone `merlinjoset/BackendPortalAPI` repo if it is ever needed for reference.
- The data model and Neon database are unchanged - the Next.js `/api` routes read/write
  the same `Tbl*` tables the .NET API used.
- Uploaded photos are written to `public/uploads`, which is **ephemeral on Render**
  (lost on redeploy). Move to object storage (S3/R2) before relying on uploads in production.
- Membership validation, contact-reveal approvals, shortlists, interests, and the admin
  panel all work exactly as before, now served from the one app.
