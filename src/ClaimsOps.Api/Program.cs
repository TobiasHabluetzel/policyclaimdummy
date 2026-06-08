using System.Net.Http.Headers;
using Demo.ClaimsOps.Services;
using Demo.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;

var builder = WebApplication.CreateBuilder(args);

var connectionString = ConnectionString.Normalize(
    builder.Configuration.GetConnectionString("DefaultConnection"));
if (!string.IsNullOrEmpty(connectionString))
{
    builder.Services.AddDbContext<AppDbContext>(o => o.UseNpgsql(connectionString));
}

builder.Services.AddScoped<ClaimService>();

// AC client — used to call POST /claims/{id}/submit when an
// evidence-evaluated webhook arrives. Endpoint + token come from the same
// env vars the claim wizard uses (ClaimsApi__Endpoint / ClaimsApi__ApiToken).
builder.Services.AddHttpClient("ClaimsApi", client =>
{
    var endpoint = builder.Configuration["ClaimsApi:Endpoint"];
    if (!string.IsNullOrEmpty(endpoint))
    {
        client.BaseAddress = new Uri(endpoint.TrimEnd('/') + "/");
    }
    var token = builder.Configuration["ClaimsApi:ApiToken"];
    if (!string.IsNullOrEmpty(token))
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }
});

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(
        new System.Text.Json.Serialization.JsonStringEnumConverter()));

var app = builder.Build();

// Make sure the Claims table exists on boot. EnsureCreated bails when any
// table is present (PolicyAdmin's tables may already be here in shared-DB
// setups), so additionally probe for our table and create the model's
// tables if missing.
if (!string.IsNullOrEmpty(connectionString))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();
    try { await db.Claims.AnyAsync(); }
    catch (Npgsql.PostgresException ex) when (ex.SqlState == "42P01")
    {
        var creator = db.GetInfrastructure().GetRequiredService<IRelationalDatabaseCreator>();
        await creator.CreateTablesAsync();
    }
}

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
