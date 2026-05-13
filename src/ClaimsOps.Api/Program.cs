using Demo.Shared;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = ConnectionString.Normalize(
    builder.Configuration.GetConnectionString("DefaultConnection"));
if (!string.IsNullOrEmpty(connectionString))
{
    builder.Services.AddDbContext<AppDbContext>(o => o.UseNpgsql(connectionString));
}

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(
        new System.Text.Json.Serialization.JsonStringEnumConverter()));

var app = builder.Build();

// ClaimsOps shares the schema with PolicyAdmin — that service owns
// migrations. Here we just connect.

app.MapGet("/healthz", () => Results.Ok("healthy"));
app.MapControllers();

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
