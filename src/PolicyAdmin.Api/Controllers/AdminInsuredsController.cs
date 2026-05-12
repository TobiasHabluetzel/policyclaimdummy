using Demo.Shared;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Demo.PolicyAdmin.Controllers;

[ApiController]
[Route("api/admin/insureds")]
public class AdminInsuredsController(AppDbContext db) : ControllerBase
{
    /// <summary>Autocomplete for the add-policy form. Matches on email or last name.</summary>
    [HttpGet("search")]
    public async Task<ActionResult<object[]>> Search([FromQuery] string? term, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(term) || term.Length < 2) return Ok(Array.Empty<object>());
        var t = term.Trim();
        var rows = await db.Insureds.AsNoTracking()
            .Where(i => i.Email.Contains(t) || i.LastName.Contains(t) || i.FirstName.Contains(t))
            .OrderBy(i => i.LastName)
            .Take(20)
            .ToListAsync(ct);
        return Ok(rows.Select(i => new
        {
            id = i.Id,
            firstName = i.FirstName,
            lastName = i.LastName,
            dateOfBirth = i.DateOfBirth.ToString("yyyy-MM-dd"),
            email = i.Email,
            phoneNumber = i.PhoneNumber,
        }));
    }
}
