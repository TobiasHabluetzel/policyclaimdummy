using System.Security.Cryptography;
using System.Text.Json;
using Demo.Shared;
using Microsoft.EntityFrameworkCore;

namespace Demo.ClaimsOps.Services;

/// <summary>
/// Owns the Claim row that mirrors AC's claim record. Inserted/upserted
/// when AC's reviewed webhook fires, then hydrated from the payload so
/// the ops console can render claimant + incident + costs + review.
/// </summary>
public class ClaimService(
    AppDbContext db,
    IConfiguration config,
    ILogger<ClaimService> logger)
{
    private const string Alphabet = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
    private const int CodeLength = 6;
    private const int MaxAttempts = 8;

    /// <summary>Reserves a unique short code (e.g. CLM-F9KX7T) — used by the wizard service to tag a claim before submitting to AC.</summary>
    public async Task<string> GenerateUniqueCodeAsync(CancellationToken ct)
    {
        var prefix = config["App:ReferencePrefix"]?.Trim() ?? "CLM";
        for (var attempt = 0; attempt < MaxAttempts; attempt++)
        {
            var code = $"{prefix}-{RandomBlock(CodeLength)}";
            var taken = await db.Claims.AnyAsync(c => c.ShortCode == code, ct);
            if (!taken) return code;
            logger.LogWarning("[claim] code {Code} collided, retrying", code);
        }
        throw new InvalidOperationException($"Could not generate a unique short code after {MaxAttempts} attempts");
    }

    public async Task<Claim?> GetByShortCodeAsync(string shortCode, CancellationToken ct)
        => await db.Claims.AsNoTracking().FirstOrDefaultAsync(c => c.ShortCode == shortCode, ct);

    /// <summary>Newest-first list for the inbox, with optional status filter and free-text search across short code, claimant name and email.</summary>
    public async Task<(IReadOnlyList<Claim> Items, int Total)> ListAsync(
        string? status, string? search, int offset, int limit, CancellationToken ct)
    {
        var q = db.Claims.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(status))
            q = q.Where(c => c.Status == status);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            q = q.Where(c =>
                c.ShortCode.Contains(s)
                || (c.ClaimantEmail != null && c.ClaimantEmail.Contains(s))
                || (c.ClaimantFirstName != null && c.ClaimantFirstName.Contains(s))
                || (c.ClaimantLastName != null && c.ClaimantLastName.Contains(s))
                || (c.PolicyReference != null && c.PolicyReference.Contains(s)));
        }
        var total = await q.CountAsync(ct);
        var items = await q
            .OrderByDescending(c => c.CreatedAt)
            .Skip(offset).Take(limit)
            .ToListAsync(ct);
        return (items, total);
    }

    public async Task<string?> LookupAcClaimIdAsync(string shortCode, CancellationToken ct)
        => (await db.Claims.AsNoTracking().FirstOrDefaultAsync(c => c.ShortCode == shortCode, ct))?.AcClaimId;

    /// <summary>
    /// Populates the Claim row from AC's reviewed-webhook payload. Idempotent.
    /// If the row isn't there yet, it's upserted using externalId as the short
    /// code (covers wizard-created claims whose only local trace is the AC id).
    /// </summary>
    public async Task<bool> HydrateFromWebhookAsync(JsonElement data, CancellationToken ct)
    {
        if (!data.TryGetProperty("id", out var idEl) || idEl.ValueKind != JsonValueKind.String)
            return false;
        var acClaimId = idEl.GetString()!;

        var claim = await db.Claims.FirstOrDefaultAsync(c => c.AcClaimId == acClaimId, ct);
        if (claim is null)
        {
            var externalId = StringFrom(data, "externalId");
            if (string.IsNullOrWhiteSpace(externalId))
            {
                logger.LogWarning("[claim] webhook for unknown AC id {AcId} and no externalId — skipping hydrate", acClaimId);
                return false;
            }
            claim = new Claim
            {
                ShortCode = externalId,
                AcClaimId = acClaimId,
                Status = "submitted",
                CreatedAt = DateTime.UtcNow,
            };
            db.Claims.Add(claim);
            logger.LogInformation("[claim] webhook created missing row {Code} -> {AcId}", externalId, acClaimId);
        }

        claim.Status = StringFrom(data, "status") ?? claim.Status;
        claim.Currency = StringFrom(data, "currency") ?? claim.Currency;
        claim.ProductCode = StringFrom(data, "product") ?? claim.ProductCode;
        claim.ClaimDate = ParseDate(data, "claimDate") ?? claim.ClaimDate;
        claim.ReviewedAt = DateTime.UtcNow;

        if (data.TryGetProperty("claimant", out var claimant) && claimant.ValueKind == JsonValueKind.Object)
        {
            claim.ClaimantFirstName = StringFrom(claimant, "firstName");
            claim.ClaimantLastName = StringFrom(claimant, "lastName");
            claim.ClaimantDateOfBirth = ParseDate(claimant, "dateOfBirth");
            claim.ClaimantEmail = StringFrom(claimant, "email");
            claim.ClaimantPhoneNumber = StringFrom(claimant, "phoneNumber");
        }

        if (data.TryGetProperty("incident", out var inc) && inc.ValueKind == JsonValueKind.Object)
        {
            claim.IncidentDescription = StringFrom(inc, "description");
            claim.IncidentDate = ParseDate(inc, "incidentDate");
            claim.IncidentType = StringFrom(inc, "incidentType");
        }

        if (data.TryGetProperty("policyCoverage", out var pc) && pc.ValueKind == JsonValueKind.Object)
        {
            claim.PolicyReference = StringFrom(pc, "reference") ?? claim.PolicyReference;
        }

        var documents = data.TryGetProperty("documents", out var docs) && docs.ValueKind == JsonValueKind.Array
            ? docs.EnumerateArray().ToArray()
            : Array.Empty<JsonElement>();
        var docNameById = documents
            .Where(d => d.TryGetProperty("id", out _))
            .ToDictionary(d => d.GetProperty("id").GetString()!, d => StringFrom(d, "filename") ?? "");

        if (data.TryGetProperty("costs", out var costs) && costs.ValueKind == JsonValueKind.Array)
        {
            var projected = costs.EnumerateArray().Select(c =>
            {
                var amount = c.TryGetProperty("amount", out var amt) && amt.ValueKind == JsonValueKind.Object
                    ? amt : default;
                var review = c.TryGetProperty("review", out var rv) && rv.ValueKind == JsonValueKind.Object
                    ? rv : default;
                var docId = StringFrom(c, "originatingDocumentId");
                return new
                {
                    id = StringFrom(c, "id"),
                    date = StringFrom(c, "date"),
                    classification = StringFrom(c, "classification"),
                    description = StringFrom(c, "description"),
                    amount = amount.ValueKind == JsonValueKind.Object ? NumberFrom(amount, "amount") : null,
                    currency = amount.ValueKind == JsonValueKind.Object ? StringFrom(amount, "currency") : null,
                    documentId = docId,
                    documentFilename = docId is null ? null : docNameById.GetValueOrDefault(docId),
                    isCovered = review.ValueKind == JsonValueKind.Object ? StringFrom(review, "isCovered") : null,
                    coveredAmount = review.ValueKind == JsonValueKind.Object ? NumberFrom(review, "coveredAmount") : null,
                    argumentation = review.ValueKind == JsonValueKind.Object ? StringFrom(review, "argumentation") : null,
                };
            });
            claim.CostsJson = JsonSerializer.Serialize(projected);
        }

        var docsProjected = documents.Select(d => new
        {
            id = StringFrom(d, "id"),
            filename = StringFrom(d, "filename"),
            classification = StringFrom(d, "classification"),
            summary = StringFrom(d, "summary"),
        });
        claim.DocumentsJson = JsonSerializer.Serialize(docsProjected);

        if (data.TryGetProperty("review", out var reviewBlock) && reviewBlock.ValueKind == JsonValueKind.Object)
        {
            claim.ReviewJson = reviewBlock.GetRawText();
        }

        await db.SaveChangesAsync(ct);
        logger.LogInformation("[claim] hydrated {Code} ({AcId}) status={Status}", claim.ShortCode, acClaimId, claim.Status);
        return true;
    }

    private static string? StringFrom(JsonElement el, string prop)
        => el.TryGetProperty(prop, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;

    private static decimal? NumberFrom(JsonElement el, string prop)
    {
        // AC sometimes encodes monetary values as numeric strings ("150.00")
        // to preserve decimal precision. Accept either shape.
        if (!el.TryGetProperty(prop, out var v)) return null;
        return v.ValueKind switch
        {
            JsonValueKind.Number => v.GetDecimal(),
            JsonValueKind.String when decimal.TryParse(
                v.GetString(),
                System.Globalization.NumberStyles.Number,
                System.Globalization.CultureInfo.InvariantCulture,
                out var d) => d,
            _ => null,
        };
    }

    private static DateOnly? ParseDate(JsonElement el, string prop)
    {
        var s = StringFrom(el, prop);
        return DateOnly.TryParse(s, out var d) ? d : null;
    }

    private static string RandomBlock(int length)
    {
        var chars = new char[length];
        Span<byte> buf = stackalloc byte[1];
        var max = (byte)(byte.MaxValue - (byte.MaxValue + 1) % Alphabet.Length);
        for (var i = 0; i < length; i++)
        {
            byte b;
            do
            {
                RandomNumberGenerator.Fill(buf);
                b = buf[0];
            } while (b > max);
            chars[i] = Alphabet[b % Alphabet.Length];
        }
        return new string(chars);
    }
}
