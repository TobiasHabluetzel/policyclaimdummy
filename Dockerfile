# Stage 1 — build FakeNIS SPA
FROM node:20-alpine AS nis
WORKDIR /app
COPY src/FakeNis.Web/package*.json ./
RUN npm ci
COPY src/FakeNis.Web/ ./
RUN npx vite build --outDir /nis-dist --emptyOutDir

# Stage 2 — build FakeClaimsOps SPA
FROM node:20-alpine AS ops
WORKDIR /app
COPY src/FakeClaimsOps.Web/package*.json ./
RUN npm ci
COPY src/FakeClaimsOps.Web/ ./
RUN npx vite build --outDir /ops-dist --emptyOutDir

# Stage 3 — build .NET API and bundle the two SPAs as static assets
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend
WORKDIR /app
COPY src/SystemsDemo.Api/*.csproj ./
RUN dotnet restore
COPY src/SystemsDemo.Api/ ./
COPY --from=nis /nis-dist ./wwwroot/nis/
COPY --from=ops /ops-dist ./wwwroot/ops/
RUN dotnet publish -c Release -o /publish

# Stage 4 — runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=backend /publish .
EXPOSE 8080
CMD ["sh", "-c", "ASPNETCORE_HTTP_PORTS=${PORT:-8080} dotnet SystemsDemo.Api.dll"]
