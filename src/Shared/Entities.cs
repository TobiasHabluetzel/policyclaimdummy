namespace Demo.Shared;

public class Insured
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public DateOnly DateOfBirth { get; set; }
    /// <summary>Required and unique. Email is the lookup key for an Insured.</summary>
    public string Email { get; set; } = "";
    public string? PhoneNumber { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<PolicyInsured> PolicyLinks { get; set; } = new();
}

public enum CoverageTier { Bronze, Silver, Gold }
public enum PolicyDuration { SingleTrip, Annual }
public enum PolicyType { Individual, Family, Business }

public class Policy
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string DisplayNumber { get; set; } = "";
    public CoverageTier Tier { get; set; }
    public PolicyDuration Duration { get; set; }
    public PolicyType Type { get; set; }
    public DateOnly PeriodStart { get; set; }
    public DateOnly PeriodEnd { get; set; }
    public string Destination { get; set; } = "";
    public string CurrencyCode { get; set; } = "CHF";
    public DateOnly? CancelledAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<PolicyInsured> InsuredLinks { get; set; } = new();
}

public class PolicyInsured
{
    public Guid PolicyId { get; set; }
    public Policy? Policy { get; set; }
    public Guid InsuredId { get; set; }
    public Insured? Insured { get; set; }
    public bool IsHolder { get; set; }
}

/// <summary>
/// Pre-built coverage tree per tier — stored shape is the same JSON array AC
/// expects on policyCoverage.coverages so the claims app forwards it verbatim.
/// </summary>
public class CoverageTemplate
{
    public CoverageTier Tier { get; set; }
    public string Name { get; set; } = "";
    public string CoverageJson { get; set; } = "[]";
}
