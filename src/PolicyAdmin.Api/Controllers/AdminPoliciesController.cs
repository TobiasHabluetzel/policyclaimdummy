using Demo.Shared;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Demo.PolicyAdmin.Controllers;

[ApiController]
[Route("api/admin/policies")]
public class AdminPoliciesController(AppDbContext db) : ControllerBase
{
    public record AddInsuredInput(
        Guid? Id, string FirstName, string LastName, DateOnly DateOfBirth, string Email, string? PhoneNumber);

    public record AddPolicyInput(
        CoverageTier Tier,
        PolicyDuration Duration,
        PolicyType Type,
        DateOnly PeriodStart,
        DateOnly PeriodEnd,
        string Destination,
        string CurrencyCode,
        AddInsuredInput Holder,
        AddInsuredInput[]? AdditionalInsureds);

    [HttpGet("")]
    public async Task<ActionResult<object>> List(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int take = 50,
        [FromQuery] int skip = 0,
        CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var q = db.Policies.AsNoTracking()
            .Include(p => p.InsuredLinks).ThenInclude(l => l.Insured)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            q = q.Where(p =>
                p.DisplayNumber.Contains(term) ||
                p.Destination.Contains(term) ||
                p.InsuredLinks.Any(l =>
                    l.Insured!.Email.Contains(term) ||
                    l.Insured.LastName.Contains(term) ||
                    l.Insured.FirstName.Contains(term)));
        }

        var rows = await q.OrderByDescending(p => p.CreatedAt).Skip(skip).Take(take).ToListAsync(ct);

        var statusFiltered = string.IsNullOrWhiteSpace(status)
            ? rows
            : rows.Where(p => string.Equals(
                PolicyHelpers.DeriveStatus(p, today).ToString(), status, StringComparison.OrdinalIgnoreCase)).ToList();

        return Ok(new
        {
            total = statusFiltered.Count,
            items = statusFiltered.Select(p =>
            {
                var holder = p.InsuredLinks.FirstOrDefault(l => l.IsHolder)?.Insured;
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
                    status = PolicyHelpers.DeriveStatus(p, today).ToString(),
                    holderName = holder is null ? "" : $"{holder.FirstName} {holder.LastName}",
                    holderEmail = holder?.Email,
                    insuredCount = p.InsuredLinks.Count,
                };
            }),
        });
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<object>> Get(Guid id, CancellationToken ct)
    {
        var p = await db.Policies.AsNoTracking()
            .Include(x => x.InsuredLinks).ThenInclude(l => l.Insured)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        if (p is null) return NotFound();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var template = await db.CoverageTemplates.AsNoTracking().FirstAsync(t => t.Tier == p.Tier, ct);
        using var coverageDoc = System.Text.Json.JsonDocument.Parse(template.CoverageJson);
        var coverages = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(
            coverageDoc.RootElement.GetRawText());
        return Ok(new
        {
            id = p.Id,
            displayNumber = p.DisplayNumber,
            tier = p.Tier.ToString(),
            tierName = template.Name,
            duration = p.Duration.ToString(),
            type = p.Type.ToString(),
            periodStart = p.PeriodStart.ToString("yyyy-MM-dd"),
            periodEnd = p.PeriodEnd.ToString("yyyy-MM-dd"),
            destination = p.Destination,
            currencyCode = p.CurrencyCode,
            cancelledAt = p.CancelledAt?.ToString("yyyy-MM-dd"),
            status = PolicyHelpers.DeriveStatus(p, today).ToString(),
            insureds = p.InsuredLinks
                .OrderByDescending(l => l.IsHolder)
                .Select(l => new
                {
                    id = l.Insured!.Id,
                    firstName = l.Insured.FirstName,
                    lastName = l.Insured.LastName,
                    dateOfBirth = l.Insured.DateOfBirth.ToString("yyyy-MM-dd"),
                    email = l.Insured.Email,
                    phoneNumber = l.Insured.PhoneNumber,
                    isHolder = l.IsHolder,
                }),
            coverages,
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<object>> Update(Guid id, [FromBody] AddPolicyInput body, CancellationToken ct)
    {
        if (body.Holder is null) return BadRequest("Holder is required.");
        if (string.IsNullOrWhiteSpace(body.Holder.Email)) return BadRequest("Email is required for every insured.");
        foreach (var extra in body.AdditionalInsureds ?? Array.Empty<AddInsuredInput>())
            if (string.IsNullOrWhiteSpace(extra.Email)) return BadRequest("Email is required for every insured.");

        var policy = await db.Policies
            .Include(p => p.InsuredLinks).ThenInclude(l => l.Insured)
            .FirstOrDefaultAsync(p => p.Id == id, ct);
        if (policy is null) return NotFound();

        policy.Tier = body.Tier;
        policy.Duration = body.Duration;
        policy.Type = body.Type;
        policy.PeriodStart = body.PeriodStart;
        policy.PeriodEnd = body.PeriodEnd;
        policy.Destination = body.Destination;
        policy.CurrencyCode = string.IsNullOrWhiteSpace(body.CurrencyCode) ? "CHF" : body.CurrencyCode;

        async Task<Insured> ResolveAsync(AddInsuredInput input)
        {
            if (input.Id is Guid gid)
            {
                var existing = await db.Insureds.FirstOrDefaultAsync(i => i.Id == gid, ct);
                if (existing is not null) return existing;
            }
            if (!string.IsNullOrWhiteSpace(input.Email))
            {
                var byEmail = await db.Insureds.FirstOrDefaultAsync(i => i.Email == input.Email, ct);
                if (byEmail is not null) return byEmail;
            }
            var created = new Insured
            {
                FirstName = input.FirstName,
                LastName = input.LastName,
                DateOfBirth = input.DateOfBirth,
                Email = input.Email,
                PhoneNumber = input.PhoneNumber,
            };
            db.Insureds.Add(created);
            return created;
        }

        // Reset insured links — easier than diffing for the demo.
        db.PolicyInsureds.RemoveRange(policy.InsuredLinks);
        await db.SaveChangesAsync(ct);

        var holder = await ResolveAsync(body.Holder);
        db.PolicyInsureds.Add(new PolicyInsured { PolicyId = policy.Id, InsuredId = holder.Id, IsHolder = true });
        foreach (var extra in body.AdditionalInsureds ?? Array.Empty<AddInsuredInput>())
        {
            var resolved = await ResolveAsync(extra);
            if (resolved.Id == holder.Id) continue;
            db.PolicyInsureds.Add(new PolicyInsured { PolicyId = policy.Id, InsuredId = resolved.Id, IsHolder = false });
        }
        await db.SaveChangesAsync(ct);

        return Ok(new { id = policy.Id, displayNumber = policy.DisplayNumber });
    }

    [HttpPost("")]
    public async Task<ActionResult<object>> Add([FromBody] AddPolicyInput body, CancellationToken ct)
    {
        if (body.Holder is null) return BadRequest("Holder is required.");
        if (string.IsNullOrWhiteSpace(body.Holder.Email)) return BadRequest("Email is required for every insured.");
        foreach (var extra in body.AdditionalInsureds ?? Array.Empty<AddInsuredInput>())
            if (string.IsNullOrWhiteSpace(extra.Email)) return BadRequest("Email is required for every insured.");

        var policy = new Policy
        {
            DisplayNumber = await PolicyHelpers.NextDisplayNumberAsync(db, ct),
            Tier = body.Tier,
            Duration = body.Duration,
            Type = body.Type,
            PeriodStart = body.PeriodStart,
            PeriodEnd = body.PeriodEnd,
            Destination = body.Destination,
            CurrencyCode = string.IsNullOrWhiteSpace(body.CurrencyCode) ? "CHF" : body.CurrencyCode,
        };

        async Task<Insured> ResolveAsync(AddInsuredInput input)
        {
            // Email is the identity key. Existing row with the same email is
            // the same person — link, don't duplicate.
            var email = input.Email.Trim();
            var existing = await db.Insureds.FirstOrDefaultAsync(i => i.Email == email, ct);
            if (existing is not null) return existing;
            var created = new Insured
            {
                FirstName = input.FirstName,
                LastName = input.LastName,
                DateOfBirth = input.DateOfBirth,
                Email = email,
                PhoneNumber = string.IsNullOrWhiteSpace(input.PhoneNumber) ? null : input.PhoneNumber.Trim(),
            };
            db.Insureds.Add(created);
            return created;
        }

        var holder = await ResolveAsync(body.Holder);
        policy.InsuredLinks.Add(new PolicyInsured { Insured = holder, IsHolder = true });

        foreach (var extra in body.AdditionalInsureds ?? Array.Empty<AddInsuredInput>())
        {
            var resolved = await ResolveAsync(extra);
            if (resolved.Id == holder.Id) continue;
            policy.InsuredLinks.Add(new PolicyInsured { Insured = resolved, IsHolder = false });
        }

        db.Policies.Add(policy);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(Get), new { id = policy.Id }, new { id = policy.Id, displayNumber = policy.DisplayNumber });
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<object>> Cancel(Guid id, CancellationToken ct)
    {
        var policy = await db.Policies.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (policy is null) return NotFound();
        if (policy.CancelledAt is not null) return Ok(new { id = policy.Id, alreadyCancelled = true });
        policy.CancelledAt = DateOnly.FromDateTime(DateTime.UtcNow);
        await db.SaveChangesAsync(ct);
        return Ok(new { id = policy.Id, cancelledAt = policy.CancelledAt?.ToString("yyyy-MM-dd") });
    }
}
