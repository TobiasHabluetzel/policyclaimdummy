using Microsoft.EntityFrameworkCore;

namespace Demo.Shared;

public static class Seeder
{
    public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
    {
        await SeedCoverageTemplatesAsync(db, ct);
        await SeedSampleDataAsync(db, ct);
    }

    // ----- Coverage templates ----------------------------------------------

    private static async Task SeedCoverageTemplatesAsync(AppDbContext db, CancellationToken ct)
    {
        if (await db.CoverageTemplates.AnyAsync(ct)) return;
        db.CoverageTemplates.AddRange(
            new CoverageTemplate { Tier = CoverageTier.Bronze, Name = "Essential cover", CoverageJson = CoverageTrees.Bronze },
            new CoverageTemplate { Tier = CoverageTier.Silver, Name = "Standard cover",  CoverageJson = CoverageTrees.Silver },
            new CoverageTemplate { Tier = CoverageTier.Gold,   Name = "Premium cover",   CoverageJson = CoverageTrees.Gold });
        await db.SaveChangesAsync(ct);
    }

    // ----- Sample insureds + policies --------------------------------------

    private static async Task SeedSampleDataAsync(AppDbContext db, CancellationToken ct)
    {
        if (await db.Policies.AnyAsync(ct)) return;

        var rng = new Random(42);
        var firsts = new[] {
            "Alex","Beatrice","Catherine","Daniel","Eva","Felix","Greta","Hannah",
            "Iris","Jonas","Karin","Lukas","Maria","Nico","Olivia","Patrick",
            "Quentin","Renate","Sophia","Tobias","Ursula","Valentin","Wendy","Xavier","Yara","Zoe",
        };
        var lasts = new[] {
            "Müller","Schneider","Weber","Meier","Fischer","Keller","Brunner",
            "Steiner","Hofmann","Bauer","Lehmann","Berger","Frei","Wyss","Kunz",
        };

        // 25 unique insureds with a few "multi-policy" emails sprinkled in.
        var insureds = new List<Insured>();
        for (int i = 0; i < 25; i++)
        {
            var first = firsts[rng.Next(firsts.Length)];
            var last = lasts[rng.Next(lasts.Length)];
            var year = 1955 + rng.Next(50);
            var dob = new DateOnly(year, 1 + rng.Next(12), 1 + rng.Next(27));
            insureds.Add(new Insured
            {
                FirstName = first,
                LastName = last,
                DateOfBirth = dob,
                Email = $"{first}.{last}{i}@example.com".ToLowerInvariant(),
                PhoneNumber = $"+41 79 {rng.Next(100, 999)} {rng.Next(10, 99)} {rng.Next(10, 99)}",
            });
        }
        // Two demo emails that hold multiple policies (portal multi-policy scenario).
        insureds[0].Email = "multiservice1@example.com";
        insureds[5].Email = "multiservice1@example.com";
        insureds[9].Email = "multiservice1@example.com";
        db.Insureds.AddRange(insureds);
        await db.SaveChangesAsync(ct);

        var destinations = new[] {
            "Greece","Spain","Italy","France","Thailand","USA","Japan","Mexico",
            "Switzerland","Austria","Portugal","Croatia","Turkey","Egypt","UAE",
        };

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var policies = new List<Policy>();
        var links = new List<PolicyInsured>();

        for (int i = 0; i < 65; i++)
        {
            var tier = (CoverageTier)rng.Next(3);
            var duration = rng.NextDouble() < 0.7 ? PolicyDuration.SingleTrip : PolicyDuration.Annual;
            var type = rng.NextDouble() switch
            {
                < 0.60 => PolicyType.Individual,
                < 0.85 => PolicyType.Family,
                _      => PolicyType.Business,
            };

            // Period start spread across the last 3 years and the next 12 months.
            var startOffsetDays = rng.Next(-3 * 365, 365);
            var start = today.AddDays(startOffsetDays);
            var lengthDays = duration == PolicyDuration.SingleTrip ? rng.Next(3, 30) : 365;
            var end = start.AddDays(lengthDays);

            var holder = insureds[rng.Next(insureds.Count)];
            var policy = new Policy
            {
                DisplayNumber = await PolicyHelpers.NextDisplayNumberAsync(db, ct),
                Tier = tier,
                Duration = duration,
                Type = type,
                PeriodStart = start,
                PeriodEnd = end,
                Destination = destinations[rng.Next(destinations.Length)],
                CurrencyCode = "CHF",
                CancelledAt = rng.NextDouble() < 0.12
                    ? today.AddDays(-rng.Next(0, 200))
                    : null,
            };
            policies.Add(policy);
            links.Add(new PolicyInsured { Policy = policy, Insured = holder, IsHolder = true });

            // Extra insureds for Family / Business.
            if (type != PolicyType.Individual)
            {
                var extras = type == PolicyType.Family ? rng.Next(1, 4) : rng.Next(2, 6);
                var picked = new HashSet<Guid> { holder.Id };
                for (int j = 0; j < extras; j++)
                {
                    var candidate = insureds[rng.Next(insureds.Count)];
                    if (!picked.Add(candidate.Id)) continue;
                    links.Add(new PolicyInsured { Policy = policy, Insured = candidate, IsHolder = false });
                }
            }
        }

        db.Policies.AddRange(policies);
        db.PolicyInsureds.AddRange(links);
        await db.SaveChangesAsync(ct);
    }
}
