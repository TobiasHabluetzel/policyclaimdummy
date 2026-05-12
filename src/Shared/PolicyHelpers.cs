using Microsoft.EntityFrameworkCore;

namespace Demo.Shared;

public enum PolicyStatus { Active, Expired, Cancelled }

public static class PolicyHelpers
{
    public static PolicyStatus DeriveStatus(Policy p, DateOnly today)
    {
        if (p.CancelledAt != null) return PolicyStatus.Cancelled;
        if (p.PeriodEnd < today) return PolicyStatus.Expired;
        return PolicyStatus.Active;
    }

    /// <summary>Pulls the next sequence value and returns it formatted as P-YYYY-NNNNNN.</summary>
    public static async Task<string> NextDisplayNumberAsync(AppDbContext db, CancellationToken ct = default)
    {
        var next = await db.Database
            .SqlQueryRaw<int>("SELECT nextval('policy_number_seq')::int AS \"Value\"")
            .SingleAsync(ct);
        return $"P-{DateTime.UtcNow.Year}-{next:D6}";
    }
}
