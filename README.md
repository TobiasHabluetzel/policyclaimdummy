# policyclaimdummy

Two independent demo systems used as stand-ins for an insurer's policy administration platform and back-office claims operations console. Pairs with the claims-app + portal repos for end-to-end demos.

## Layout

```
src/
├── Shared/                  # Common entities + DbContext (referenced by both APIs)
├── PolicyAdmin.Api/         # ASP.NET 8 — REST + serves the Policy Admin SPA
├── PolicyAdmin.Web/         # React + Vite (dated-corporate skin)
├── ClaimsOps.Api/           # ASP.NET 8 — REST + serves the Claims Ops SPA
└── ClaimsOps.Web/           # React + Vite (newer-corporate skin)
```

## Deployment — two Railway services from one repo

Two Dockerfiles, two Railway services pointing at the same GitHub repo but different Dockerfile paths:

| Railway service | Dockerfile | Suggested URL |
|---|---|---|
| `policyadmin` | `Dockerfile.policyadmin` | `policyadmin-production.up.railway.app` |
| `claimsops`   | `Dockerfile.claimsops`   | `claimsops-production.up.railway.app` |

Both connect to **one shared Postgres** in the same Railway project. Set `ConnectionStrings__DefaultConnection` on each service (same value, the postgresql:// URI works — the API normalises it).

`PolicyAdmin.Api` owns the schema and runs `EnsureCreatedAsync` on startup; `ClaimsOps.Api` just connects.
