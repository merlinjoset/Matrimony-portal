# CSI Holy Matrimony

A faith-centred matrimony service for the CSI Tamil Parish (Dubai). It is now a
**single Next.js 16 application** - the web UI and the API live in one project and
talk to a **Neon PostgreSQL** database directly.

- **MarriagePortalWeb/** - the whole app: **Next.js 16** (App Router, TypeScript) +
  **shadcn/ui** (Tailwind v4) for the UI, and **`/api` route handlers** (backed by
  `postgres.js` on Neon) for the API.
- **MarriagePortal/** - the original self-contained HTML prototype (kept for reference).

> The earlier separate **.NET API** (`BackendPortalAPI`) has been **retired** - all of
> its endpoints were reimplemented as Next.js route handlers. It still exists in the
> standalone `merlinjoset/BackendPortalAPI` repo if ever needed.

## Prerequisites
- Node 20+ (pnpm or npm)
- A PostgreSQL connection string (this project uses **Neon**)

## Run it
```bash
cd MarriagePortalWeb
# .env.local (gitignored):
#   DATABASE_URL=postgresql://<user>:<pwd>@<host>.neon.tech/CSIPortal?sslmode=require
pnpm install                                  # first time only
node node_modules/next/dist/bin/next dev --port 3300
```
Open **http://localhost:3300**. That single server hosts both the UI and the API.

- The UI calls the same-origin **`/api`** (no external backend, no CORS).
- Server pages query the DB directly (`src/lib/server/queries.ts`); client components
  and mutations call the `/api` route handlers, which use the same query layer.

## Architecture
- `src/lib/server/db.ts` - the `postgres.js` client (reads `DATABASE_URL`).
- `src/lib/server/queries.ts` - all data access + business logic (profiles, members,
  contact requests, shortlists, interests, admin users). Returns the DTO shapes the UI uses.
- `src/app/api/**/route.ts` - thin HTTP route handlers over the query layer.
- The database schema is unchanged from the .NET version - the same `Tbl*` tables
  (`TblProfiles`, `TblMembers`, `TblAGMMembers`, `TblContactRequests`, `TblInterests`,
  `TblShortlists`, `TblUsers`).

## API endpoints (all under `/api`)
| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness |
| GET | `/api/profiles` | Browse with filters: `gender`, `denomination`, `congregation`, `status`, `live`, `page`, `pageSize` |
| GET | `/api/profiles/{id}` | Single profile |
| POST | `/api/profiles` | Create a profile (requires a valid membership card; status starts `Pending`) |
| GET | `/api/profiles/stats` | Dashboard counts by status |
| PATCH | `/api/profiles/{id}/status` | Change status (approve / reject / suspend) - body `{ "status": "Verified", "note": "…" }` |
| GET | `/api/profiles/{id}/contact?viewerMemberId=…` | What the viewer may see of the contact number |
| POST | `/api/profiles/{id}/contact-requests` | Request to reveal a profile's contact number |
| PATCH | `/api/contact-requests/{id}/status` | Owner approves / declines a contact request |
| GET | `/api/members/validate?membershipNo=…` | Validate a parish membership card |
| GET | `/api/members/{memberId}/shortlist` | List a member's shortlist |
| POST | `/api/members/{memberId}/shortlist` | Add to the shortlist (`{ profileId }`) |
| DELETE | `/api/members/{memberId}/shortlist/{profileId}` | Remove from the shortlist |
| GET | `/api/members/{memberId}/contact-requests/incoming` | Requests awaiting this member's approval |
| GET | `/api/members/{memberId}/contact-requests/outgoing` | Requests this member has made |
| POST | `/api/uploads/photo` | Upload a photo (multipart `file`), returns `{ url }` |
| GET / POST | `/api/interests` | List / express interest in a profile |
| PATCH | `/api/interests/{id}/status` | Accept / decline an interest |
| GET / POST | `/api/admin/users` | List / invite staff users |
| PATCH | `/api/admin/users/{id}/status` | Activate / disable a user |

## Features
- **Membership validation** - registration and member sign-in are gated by a valid card
  number, checked against the **AGM roster (`TblAGMMembers`, 885 real members)** first,
  then the sample `TblMembers`.
- **Contact-reveal approval** - a signed-in member requests a profile's contact number;
  the profile **owner** approves/declines it under **Requests**; once approved, the number
  is shown to that viewer only.
- **Shortlist** - saved to the member's account (`TblShortlists`), synced across devices.
  Members sign in by membership card number.
- **Express Interest** - an enquiry (name / mobile / message) the parish admin sees under
  **Admin → Interests**.
- **Admin panel at `/admin`** - Dashboard (live stats), Verification Queue, Members,
  Interests, plus Parishes / Users & Roles / Reports / Settings.
- **Bilingual EN/தமிழ்**, photo upload, CSI maroon/gold theme, Psalm 71:5 scripture band.

## Deploy (Render - one service)
See **[DEPLOY.md](DEPLOY.md)**. In short: one Docker web service, Root Directory
`MarriagePortalWeb`, health check `/api/health`, and a single env var `DATABASE_URL`
(the Neon connection string).

## Not yet built
- **Auth (JWT)** - the `/admin` panel and admin API are currently open (no login); add
  staff sign-in before production.
- Object storage for photos (uploads currently go to `public/uploads`, which is
  ephemeral on Render).
- API-backed Parishes (still sample data); multi-photo gallery (single `MainPhotoUrl`).
