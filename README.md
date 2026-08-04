# CSI Holy Matrimony

A real, separate **frontend + backend** application for the CSI Tamil Parish (Dubai) matrimony service.

- **BackendPortalAPI/** - .NET 10 Web API, **Clean Architecture** (`BackendPortalAPI.Domain` / `.Application` / `.Infrastructure` / `.Api`), EF Core + **PostgreSQL**. Solution: `BackendPortalAPI.slnx`
- **MarriagePortalWeb/** - **Next.js 16** (App Router, TypeScript) + **shadcn/ui** design system (Tailwind v4)
- **MarriagePortal/** - the original self-contained HTML prototype (kept for reference)

## Prerequisites
- .NET SDK 10
- Node 20+ and pnpm
- PostgreSQL running locally on `localhost:5432` (user `postgres` / password `postgres`)

## Run the backend (API)
```bash
cd BackendPortalAPI/src/BackendPortalAPI.Api
dotnet run --launch-profile http
```
- API: http://localhost:5117
- Health: http://localhost:5117/health
- OpenAPI doc: http://localhost:5117/openapi/v1.json
- On first run it **creates the `MarriagePortal` database, applies migrations, and seeds 6 sample profiles** automatically.

Connection string lives in `BackendPortalAPI/src/BackendPortalAPI.Api/appsettings.json` (`ConnectionStrings:Default`).
To point at a different PostgreSQL, edit that value (or add `appsettings.Development.json`).

## Run the frontend (web)
```bash
cd MarriagePortalWeb
pnpm install   # first time only
pnpm dev       # http://localhost:3300
```
The API base URL is set in `MarriagePortalWeb/.env.local` (`NEXT_PUBLIC_API_URL`).

## What works (first cut)
- **Profiles end-to-end**: browse (with gender / denomination / congregation filters), profile detail, and register - all backed by the API + PostgreSQL.
- **Bilingual EN/தமிழ்** across the public site, **photo upload**, and the **How It Works** page.
- **Admin panel at `/admin`** (own sidebar layout): Dashboard (live stats), Verification Queue (real Approve/Reject), Members (real list + suspend/reactivate), plus Parishes / Users & Roles / Interests / Reports / Settings.
- shadcn UI themed with the CSI maroon/gold palette, CSI emblem, Psalm 71:5 scripture band.

## API endpoints
| Method | Route | Purpose |
|---|---|---|
| GET | `/api/profiles` | Browse with filters: `gender`, `denomination`, `congregation`, `status`, `page`, `pageSize` |
| GET | `/api/profiles/{id}` | Single profile |
| POST | `/api/profiles` | Create a profile (requires a valid membership card; status starts as `Pending`) |
| GET | `/api/members/validate?membershipNo=…` | Validate a parish membership card |
| GET | `/api/profiles/stats` | Dashboard counts by status |
| PATCH | `/api/profiles/{id}/status` | Change status (approve / reject / suspend) - body `{ "status": "Verified" }` |
| POST | `/api/uploads/photo` | Upload a photo (multipart `file`), returns `{ url }` |
| GET | `/api/admin/users` | List staff/admin users |
| POST | `/api/admin/users` | Create (invite) a staff user |
| PATCH | `/api/admin/users/{id}/status` | Activate / disable a user |
| POST | `/api/interests` | Express interest in a profile (enquiry) |
| GET | `/api/interests` | List interests (admin) |
| PATCH | `/api/interests/{id}/status` | Accept / decline an interest |
| GET | `/api/members/{memberId}/shortlist` | List a member's shortlisted profiles |
| POST | `/api/members/{memberId}/shortlist` | Add a profile to the shortlist (`{ profileId }`) |
| DELETE | `/api/members/{memberId}/shortlist/{profileId}` | Remove from shortlist |
| GET | `/health` | Liveness |

## Migrations
```bash
cd BackendPortalAPI
dotnet ef migrations add <Name> --project src/BackendPortalAPI.Infrastructure --startup-project src/BackendPortalAPI.Api -o Persistence/Migrations
dotnet ef database update --project src/BackendPortalAPI.Infrastructure --startup-project src/BackendPortalAPI.Api
```

## Features
- **Membership validation** - registration is gated: the member must enter a valid, active parish membership card number (validated against `TblMembers`) before a profile can be created. The DB is seeded with sample cards (`CSI-DXB-1001`, `CSI-DXB-1002`, `CSI-FUJ-2001`, `CSI-RAK-3001`; `CSI-DXB-9999` is inactive). **Replace the `TblMembers` seed with the parish's real member list when provided.**
- **Express Interest** - on a profile, opens an enquiry dialog (name / mobile / message) → creates a real interest the parish admin sees under **Admin → Interests** (Accept / Decline).
- **Shortlist** - saved **to the member's account** in `TblShortlists` and synced across devices. Members **sign in by membership card number** (header → Sign in); shortlisting prompts sign-in if needed. Count badge in the header + a `/shortlist` page.

## Not yet built (next phases)
- **Auth (JWT)** - the `/admin` panel is currently open (no login); add staff sign-in before production
- API-backed Parishes (still sample data); member accounts (Express Interest is currently enquiry-based)
- Multi-photo gallery (entity has a single `MainPhotoUrl`)
