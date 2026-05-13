using Demo.Shared;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Demo.PolicyAdmin.Controllers;

[ApiController]
[Route("api/admin/insureds")]
public class AdminInsuredsController(AppDbContext db) : ControllerBase
{
    /// <summary>Email-first lookup for the add-policy form. 404 if not found.</summary>
    [HttpGet("by-email")]
    public async Task<ActionResult<object>> ByEmail([FromQuery] string email, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(email)) return NotFound();
        var i = await db.Insureds.AsNoTracking().FirstOrDefaultAsync(x => x.Email == email.Trim(), ct);
        if (i is null) return NotFound();
        return Ok(new
        {
            id = i.Id,
            firstName = i.FirstName,
            lastName = i.LastName,
            dateOfBirth = i.DateOfBirth.ToString("yyyy-MM-dd"),
            email = i.Email,
            phoneNumber = i.PhoneNumber,
            identityNumber = i.IdentityNumber,
        });
    }

    /// <summary>Insured list for the Insured tab, with optional search filter.</summary>
    [HttpGet("")]
    public async Task<ActionResult<object>> List(
        [FromQuery] string? search,
        [FromQuery] int take = 200,
        [FromQuery] int skip = 0,
        CancellationToken ct = default)
    {
        var q = db.Insureds.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var t = search.Trim();
            q = q.Where(i => i.Email.Contains(t) || i.LastName.Contains(t) || i.FirstName.Contains(t));
        }
        var rows = await q
            .OrderBy(i => i.LastName).ThenBy(i => i.FirstName)
            .Skip(skip).Take(take)
            .Select(i => new
            {
                id = i.Id,
                firstName = i.FirstName,
                lastName = i.LastName,
                dateOfBirth = i.DateOfBirth.ToString("yyyy-MM-dd"),
                email = i.Email,
                phoneNumber = i.PhoneNumber,
                identityNumber = i.IdentityNumber,
                policyCount = i.PolicyLinks.Count,
            })
            .ToListAsync(ct);
        return Ok(new { total = rows.Count, items = rows });
    }

    /// <summary>Insured detail including the policies this person is on.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<object>> Get(Guid id, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var insured = await db.Insureds.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        if (insured is null) return NotFound();

        // Two-step fetch with split queries to avoid the cartesian explosion
        // (PolicyLinks → Policy → InsuredLinks → Insured) that single-shot
        // Include hits with multi-traveler policies.
        var links = await db.PolicyInsureds.AsNoTracking()
            .Where(pi => pi.InsuredId == id)
            .Include(pi => pi.Policy)
                .ThenInclude(p => p!.InsuredLinks)
                    .ThenInclude(il => il.Insured)
            .AsSplitQuery()
            .ToListAsync(ct);

        return Ok(new
        {
            id = insured.Id,
            firstName = insured.FirstName,
            lastName = insured.LastName,
            dateOfBirth = insured.DateOfBirth.ToString("yyyy-MM-dd"),
            email = insured.Email,
            phoneNumber = insured.PhoneNumber,
            identityNumber = insured.IdentityNumber,
            createdAt = insured.CreatedAt,
            policies = links
                .Where(l => l.Policy is not null)
                .OrderByDescending(l => l.Policy!.CreatedAt)
                .Select(l => new
                {
                    id = l.Policy!.Id,
                    displayNumber = l.Policy.DisplayNumber,
                    tier = l.Policy.Tier.ToString(),
                    type = l.Policy.Type.ToString(),
                    duration = l.Policy.Duration.ToString(),
                    periodStart = l.Policy.PeriodStart.ToString("yyyy-MM-dd"),
                    periodEnd = l.Policy.PeriodEnd.ToString("yyyy-MM-dd"),
                    destination = l.Policy.Destination,
                    status = PolicyHelpers.DeriveStatus(l.Policy, today).ToString(),
                    isHolder = l.IsHolder,
                    insureds = l.Policy.InsuredLinks
                        .Where(il => il.Insured is not null)
                        .OrderByDescending(il => il.IsHolder)
                        .Select(il => new
                        {
                            firstName = il.Insured!.FirstName,
                            lastName = il.Insured.LastName,
                            isHolder = il.IsHolder,
                        })
                        .ToList(),
                })
                .ToList(),
        });
    }

    public record UpdateInsuredInput(
        string FirstName, string LastName, DateOnly DateOfBirth,
        string Email, string? PhoneNumber, string? IdentityNumber);

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<object>> Update(Guid id, [FromBody] UpdateInsuredInput body, CancellationToken ct)
    {
        var insured = await db.Insureds.FirstOrDefaultAsync(i => i.Id == id, ct);
        if (insured is null) return NotFound();

        var email = body.Email?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(new { error = "Email is required." });
        if (string.IsNullOrWhiteSpace(body.FirstName) || string.IsNullOrWhiteSpace(body.LastName))
            return BadRequest(new { error = "First name and last name are required." });

        // Email uniqueness check before save so the user gets a clean 409
        // instead of a generic DB constraint violation.
        if (await db.Insureds.AnyAsync(i => i.Id != id && i.Email == email, ct))
            return Conflict(new { error = "Email already in use by another insured." });

        insured.FirstName = body.FirstName.Trim();
        insured.LastName = body.LastName.Trim();
        insured.DateOfBirth = body.DateOfBirth;
        insured.Email = email;
        insured.PhoneNumber = string.IsNullOrWhiteSpace(body.PhoneNumber) ? null : body.PhoneNumber.Trim();
        insured.IdentityNumber = string.IsNullOrWhiteSpace(body.IdentityNumber) ? null : body.IdentityNumber.Trim();
        await db.SaveChangesAsync(ct);
        return Ok(new { id = insured.Id });
    }
}
