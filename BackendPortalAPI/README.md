# BackendPortalAPI

Backend Portal API for the CSI Tamil Parish (Dubai) - the **.NET 10** REST API behind the
**CSI Holy Matrimony** portal. Frontend lives in [MarriagePortalWeb](https://github.com/merlinjoset/MarriagePortalWeb).

## Architecture (Clean Architecture)
```
BackendPortalAPI.slnx
└── src/
    ├── BackendPortalAPI.Domain          entities & enums
    ├── BackendPortalAPI.Application      DTOs, services, contracts
    ├── BackendPortalAPI.Infrastructure  EF Core + PostgreSQL (Npgsql), repositories, migrations
    └── BackendPortalAPI.Api             controllers, DI, CORS, OpenAPI/Swagger
```

Tables: `TblProfiles`, `TblUsers`, `TblMembers`, `TblInterests`.

## Features
- Profiles: browse (filters), detail, create - **membership-card validated** before creation
- Photo upload (`/api/uploads/photo` → served from `wwwroot/uploads`)
- Express Interest enquiries
- Admin: dashboard stats, verification (status changes), staff users & roles, interests
- JSON string enums, CORS for the Next.js frontend, **auto-migrate + seed on startup**

## Run
```bash
cd src/BackendPortalAPI.Api
dotnet run --launch-profile http
```
- API: http://localhost:5117  ·  Health: `/health`  ·  Swagger UI: `/swagger`
- Requires **PostgreSQL** on `localhost:5432`. Connection string is in `appsettings.json`
  (`ConnectionStrings:Default`) - defaults to a local `MarriagePortal` database. On first run it
  creates the database, applies migrations, and seeds sample data.

## Migrations
```bash
dotnet ef migrations add <Name> --project src/BackendPortalAPI.Infrastructure --startup-project src/BackendPortalAPI.Api -o Persistence/Migrations
dotnet ef database update --project src/BackendPortalAPI.Infrastructure --startup-project src/BackendPortalAPI.Api
```

> **Note:** the membership registry (`TblMembers`) is currently seeded with sample cards;
> replace it with the parish's real member list when available.
