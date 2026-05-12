using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Database (skipped when no connection string set, e.g. first local boot).
var connectionString = NormalizeNpgsqlConnectionString(
    builder.Configuration.GetConnectionString("DefaultConnection"));
if (!string.IsNullOrEmpty(connectionString))
{
    builder.Services.AddDbContext<SystemsDemo.Api.Data.AppDbContext>(o =>
        o.UseNpgsql(connectionString));
}

builder.Services.AddControllers();

// GraphQL surface (NIS-compatible) — schema lands in the next commit.
builder.Services
    .AddGraphQLServer()
    .AddQueryType<SystemsDemo.Api.GraphQL.Query>();

var app = builder.Build();

if (!string.IsNullOrEmpty(connectionString))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<SystemsDemo.Api.Data.AppDbContext>();
    await db.Database.EnsureCreatedAsync();
}

app.MapGet("/healthz", () => Results.Ok("healthy"));
app.MapControllers();
app.MapGraphQL("/graphql");

// Serve the two demo SPAs at /nis/* and /ops/* from the same deploy.
ServeSpa(app, "/nis", "nis");
ServeSpa(app, "/ops", "ops");

// Landing page picks one or shows both — for now redirect to /nis.
app.MapGet("/", () => Results.Redirect("/nis/"));

app.Run();

static void ServeSpa(WebApplication app, string requestPath, string folder)
{
    var root = System.IO.Path.Combine(app.Environment.ContentRootPath, "wwwroot", folder);
    if (!Directory.Exists(root)) return;

    var files = new PhysicalFileProvider(root);
    app.UseStaticFiles(new StaticFileOptions
    {
        RequestPath = requestPath,
        FileProvider = files,
    });

    // SPA fallback for client-side routes under this path.
    app.MapFallback(requestPath + "/{*path:nonfile}", async ctx =>
    {
        ctx.Response.ContentType = "text/html";
        ctx.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
        await ctx.Response.SendFileAsync(System.IO.Path.Combine(root, "index.html"));
    });
}

// Convert Railway's postgresql:// URI to Npgsql keyword=value form.
static string? NormalizeNpgsqlConnectionString(string? raw)
{
    if (string.IsNullOrWhiteSpace(raw)) return raw;
    if (!raw.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) &&
        !raw.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        return raw;
    var uri = new Uri(raw);
    var userInfo = uri.UserInfo.Split(':', 2);
    var b = new Npgsql.NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = uri.Port > 0 ? uri.Port : 5432,
        Username = Uri.UnescapeDataString(userInfo[0]),
        Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "",
        Database = uri.AbsolutePath.TrimStart('/'),
    };
    return b.ConnectionString;
}
