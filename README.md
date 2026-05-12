# policyclaimdummy

Demo back-end with two distinct "legacy system" front-ends, used as a stand-in for an insurer's NIS (policy admin) and back-office claims operations system. Pairs with the claims-app and portal repos.

## Layout

- `src/SystemsDemo.Api/` — single ASP.NET 8 service. Exposes:
  - **GraphQL** at `/graphql` — implements the NIS operations the claims-app calls (search by email / number, situation, dashboard, coverages). Drop-in for a real NIS endpoint via env var.
  - **REST** under `/api/` — internal endpoints powering both demo front-ends (add / list / cancel policy, claim inbox + status pipeline, AC hand-off webhook receiver).
  - **Static SPAs** under `/nis/` (FakeNIS) and `/ops/` (FakeClaimsOps).
- `src/FakeNis.Web/` — dated-corporate React + Vite app for policy admin.
- `src/FakeClaimsOps.Web/` — newer-corporate React + Vite app for the claims operations console.

## Deployment

Single Docker image, single Railway service. The Dockerfile builds both SPAs and bundles them into the API's `wwwroot/{nis,ops}`. Postgres attaches via `ConnectionStrings__DefaultConnection` (Railway URI accepted).
