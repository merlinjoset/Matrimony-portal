# MarriagePortalWeb - CSI Holy Matrimony (Web)

Marriage portal front end for the CSI Tamil Parish (Dubai). Built with **Next.js 16 + shadcn/ui**;
it talks to the **BackendPortalAPI** (.NET 10) over REST.

## Highlights
- **Bilingual EN / தமிழ்** across the whole public site (live language toggle)
- Public pages: home (with match search + stats), browse with filters, profile detail, register, how-it-works, shortlist
- **Membership-card-gated registration** (validated against the API)
- **Profile photo upload**
- **Express Interest** enquiries and a per-browser **Shortlist**
- **Admin panel** at `/admin`: dashboard (live stats), verification queue (approve/reject), members, users & roles, interests, parishes, reports, settings
- Themed with the CSI maroon/gold palette, CSI emblem, and a Psalm 71:5 scripture band

## Getting started
```bash
pnpm install
pnpm dev        # http://localhost:3300
```

Configure the API base URL in `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5117/api
```

## Tech
- Next.js 16 (App Router, TypeScript, Turbopack)
- shadcn/ui (Base UI) + Tailwind CSS v4
- sonner (toasts)

> The .NET backend (BackendPortalAPI) lives in a separate project. Start it first so the
> site can load profiles and accept registrations.
