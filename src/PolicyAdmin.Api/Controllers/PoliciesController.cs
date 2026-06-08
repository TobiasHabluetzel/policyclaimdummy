using System.Text.Json;
using Demo.Shared;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Demo.PolicyAdmin.Controllers;

/// <summary>
/// Public, claims-app-facing surface. Search policies, fetch one by id, get
/// the AC-shape policyCoverage. Admin endpoints live under /api/admin/ in
/// AdminPoliciesController.
/// </summary>
[ApiController]
[Route("api/policies")]
public class PoliciesController(AppDbContext db) : ControllerBase
{
    [HttpGet("search")]
    public async Task<ActionResult<object[]>> Search(
        [FromQuery] string? email,
        [FromQuery] string? number,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(email) && string.IsNullOrWhiteSpace(number))
            return BadRequest("Provide email or number.");

        var q = BasePolicyQuery();

        if (!string.IsNullOrWhiteSpace(email))
            q = q.Where(p => p.InsuredLinks.Any(l => l.Insured!.Email == email));

        if (!string.IsNullOrWhiteSpace(number))
            q = q.Where(p => p.DisplayNumber == number);

        var policies = await q.OrderByDescending(p => p.CreatedAt).Take(50).ToListAsync(ct);
        return Ok(await SerializeAsync(policies, ct));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<object>> GetById(Guid id, CancellationToken ct)
    {
        var policy = await BasePolicyQuery().FirstOrDefaultAsync(p => p.Id == id, ct);
        if (policy is null) return NotFound();
        return Ok((await SerializeAsync(new[] { policy }, ct))[0]);
    }

    // ---- helpers ----------------------------------------------------------

    private IQueryable<Policy> BasePolicyQuery() => db.Policies
        .AsNoTracking()
        .Include(p => p.InsuredLinks).ThenInclude(l => l.Insured);

    private async Task<object[]> SerializeAsync(IEnumerable<Policy> policies, CancellationToken ct)
    {
        var templates = await db.CoverageTemplates.AsNoTracking().ToDictionaryAsync(t => t.Tier, ct);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return policies.Select(p =>
        {
            var holder = p.InsuredLinks.FirstOrDefault(l => l.IsHolder)?.Insured;
            var insureds = p.InsuredLinks
                .OrderByDescending(l => l.IsHolder)
                .Select(l => new
                {
                    id = l.Insured!.Id,
                    firstName = l.Insured.FirstName,
                    lastName = l.Insured.LastName,
                    dateOfBirth = l.Insured.DateOfBirth.ToString("yyyy-MM-dd"),
                    email = l.Insured.Email,
                    phoneNumber = l.Insured.PhoneNumber,
                    identityNumber = l.Insured.IdentityNumber,
                    isHolder = l.IsHolder,
                });

            // Coverages are stored as raw JSON; parse so they appear as an
            // array in the response rather than as a stringified blob.
            using var doc = JsonDocument.Parse(templates[p.Tier].CoverageJson);
            var coverages = JsonSerializer.Deserialize<JsonElement>(doc.RootElement.GetRawText());

            return new
            {
                id = p.Id,
                displayNumber = p.DisplayNumber,
                tier = p.Tier.ToString(),
                duration = p.Duration.ToString(),
                type = p.Type.ToString(),
                periodStart = p.PeriodStart.ToString("yyyy-MM-dd"),
                periodEnd = p.PeriodEnd.ToString("yyyy-MM-dd"),
                destination = p.Destination,
                currencyCode = p.CurrencyCode,
                cancelledAt = p.CancelledAt?.ToString("yyyy-MM-dd"),
                status = PolicyHelpers.DeriveStatus(p, today).ToString(),
                productName = $"{p.Tier} {p.Duration} ({p.Type})",
                holder = holder is null ? null : new
                {
                    id = holder.Id,
                    firstName = holder.FirstName,
                    lastName = holder.LastName,
                    dateOfBirth = holder.DateOfBirth.ToString("yyyy-MM-dd"),
                    email = holder.Email,
                    phoneNumber = holder.PhoneNumber,
                },
                insureds,
                policyCoverage = new
                {
                    reference = p.DisplayNumber,
                    periodFrom = p.PeriodStart.ToString("yyyy-MM-dd"),
                    periodTo = p.PeriodEnd.ToString("yyyy-MM-dd"),
                    currency = p.CurrencyCode,
                    coverages,
                },
            } as object;
        }).ToArray();
    }
}
