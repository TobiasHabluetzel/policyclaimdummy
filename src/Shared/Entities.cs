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
    /// <summary>Optional passport or national ID number.</summary>
    public string? IdentityNumber { get; set; }
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

/// <summary>
/// Local mirror of an automated.claims claim. Inserted/upserted by the
/// reviewed webhook handler in ClaimsOps so the ops console can show
/// claimant, incident, costs and review status without re-fetching AC.
/// </summary>
public class Claim
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public required string ShortCode { get; set; }
    public required string AcClaimId { get; set; }

    public string Status { get; set; } = "submitted";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }

    public string? PolicyReference { get; set; }
    public string? ProductCode { get; set; }
    public string? Currency { get; set; }
    public DateOnly? ClaimDate { get; set; }

    public string? ClaimantFirstName { get; set; }
    public string? ClaimantLastName { get; set; }
    public DateOnly? ClaimantDateOfBirth { get; set; }
    public string? ClaimantEmail { get; set; }
    public string? ClaimantPhoneNumber { get; set; }

    public string? IncidentDescription { get; set; }
    public DateOnly? IncidentDate { get; set; }
    public string? IncidentType { get; set; }

    public string? CostsJson { get; set; }
    public string? DocumentsJson { get; set; }
    public string? ReviewJson { get; set; }
}
