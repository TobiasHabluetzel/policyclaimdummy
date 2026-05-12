using Demo.Shared;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = ConnectionString.Normalize(
    builder.Configuration.GetConnectionString("DefaultConnection"));
if (!string.IsNullOrEmpty(connectionString))
{
    builder.Services.AddDbContext<AppDbContext>(o => o.UseNpgsql(connectionString));
}

builder.Services.AddControllers();

var app = builder.Build();

// Policy Admin owns the schema — apply on startup.
if (!string.IsNullOrEmpty(connectionString))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();
}

app.MapGet("/healthz", () => Results.Ok("healthy"));
app.MapControllers();

// Serve the Policy Admin SPA from wwwroot.
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapFallback(async ctx =>
{
    ctx.Response.ContentType = "text/html";
    ctx.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    await ctx.Response.SendFileAsync(
        System.IO.Path.Combine(app.Environment.ContentRootPath, "wwwroot", "index.html"));
});

app.Run();
