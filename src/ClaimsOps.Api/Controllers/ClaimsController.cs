using System.Text.Json;
using Demo.ClaimsOps.Services;
using Microsoft.AspNetCore.Mvc;

namespace Demo.ClaimsOps.Controllers;

[ApiController]
public class ClaimsController(
    ClaimService claims,
    IHttpClientFactory httpClientFactory,
    ILogger<ClaimsController> logger) : ControllerBase
{
    /// <summary>
    /// AC's webhook receiver. Two transitions matter for the demo:
    ///   - evidence_evaluated → tell AC to submit the claim for review
    ///   - reviewed           → land the row in the ops inbox
    /// Everything else is acknowledged and ignored.
    /// </summary>
    [HttpPost("api/webhook")]
    public async Task<IActionResult> Webhook([FromBody] JsonElement payload, CancellationToken ct)
    {
        var eventType = payload.TryGetProperty("eventType", out var et) ? et.GetString() : null;
        var data = payload.TryGetProperty("data", out var d) && d.ValueKind == JsonValueKind.Object
            ? d : default;
        if (data.ValueKind != JsonValueKind.Object) return Ok();

        var status = data.TryGetProperty("status", out var s) ? s.GetString() : null;
        var acClaimId = data.TryGetProperty("id", out var idEl) && idEl.ValueKind == JsonValueKind.String
            ? idEl.GetString() : null;

        // Evidence done → kick AC's review pipeline. AC's status flow is
        // pending → processing → readyForReview → underReview → reviewed;
        // POST /claims/{id}/submit nudges it past readyForReview.
        if (!string.IsNullOrEmpty(acClaimId)
            && (eventType == "claim.evidence_evaluated"
                || string.Equals(status, "readyForReview", StringComparison.OrdinalIgnoreCase)))
        {
            try { await SubmitToAcAsync(acClaimId, ct); }
            catch (Exception ex)
            {
                logger.LogError(ex, "[webhook] AC submit failed for {AcId}", acClaimId);
            }
            return Ok();
        }

        // Reviewed → mirror the claim into the inbox.
        if (eventType == "claim.reviewed"
            || string.Equals(status, "reviewed", StringComparison.OrdinalIgnoreCase))
        {
            try { await claims.HydrateFromWebhookAsync(data, ct); }
            catch (Exception ex)
            {
                logger.LogError(ex, "[webhook] hydrate failed for event {EventType}", eventType);
            }
        }

        return Ok();
    }

    private async Task SubmitToAcAsync(string acClaimId, CancellationToken ct)
    {
        var client = httpClientFactory.CreateClient("ClaimsApi");
        if (client.BaseAddress is null)
        {
            logger.LogWarning("[webhook] ClaimsApi:Endpoint not configured — cannot submit {AcId}", acClaimId);
            return;
        }
        using var res = await client.PostAsync($"claims/{acClaimId}/submit", content: null, ct);
        if (!res.IsSuccessStatusCode)
        {
            var body = await res.Content.ReadAsStringAsync(ct);
            logger.LogWarning("[webhook] AC submit {AcId} returned {Status}: {Body}",
                acClaimId, (int)res.StatusCode, body);
        }
        else
        {
            logger.LogInformation("[webhook] AC submit triggered for {AcId}", acClaimId);
        }
    }

    [HttpGet("api/claims")]
    public async Task<IActionResult> List(
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int offset = 0,
        [FromQuery] int limit = 50,
        CancellationToken ct = default)
    {
        var (items, total) = await claims.ListAsync(status, search, offset, limit, ct);
        return Ok(new
        {
            total,
            items = items.Select(c => new
            {
                shortCode = c.ShortCode,
                acClaimId = c.AcClaimId,
                status = c.Status,
                createdAt = c.CreatedAt,
                reviewedAt = c.ReviewedAt,
                policyReference = c.PolicyReference,
                claimDate = c.ClaimDate?.ToString("yyyy-MM-dd"),
                claimantName = string.Join(' ', new[] { c.ClaimantFirstName, c.ClaimantLastName }.Where(s => !string.IsNullOrWhiteSpace(s))),
                claimantEmail = c.ClaimantEmail,
            }),
        });
    }

    [HttpGet("api/claims/{shortCode}")]
    public async Task<IActionResult> GetClaim(string shortCode, CancellationToken ct)
    {
        var claim = await claims.GetByShortCodeAsync(shortCode, ct);
        if (claim is null) return NotFound();

        JsonElement? Parse(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return null;
            using var doc = JsonDocument.Parse(raw);
            return doc.RootElement.Clone();
        }

        return Ok(new
        {
            shortCode = claim.ShortCode,
            acClaimId = claim.AcClaimId,
            status = claim.Status,
            createdAt = claim.CreatedAt,
            reviewedAt = claim.ReviewedAt,
            policyReference = claim.PolicyReference,
            productCode = claim.ProductCode,
            currency = claim.Currency,
            claimDate = claim.ClaimDate?.ToString("yyyy-MM-dd"),
            claimant = new
            {
                firstName = claim.ClaimantFirstName,
                lastName = claim.ClaimantLastName,
                dateOfBirth = claim.ClaimantDateOfBirth?.ToString("yyyy-MM-dd"),
                email = claim.ClaimantEmail,
                phoneNumber = claim.ClaimantPhoneNumber,
            },
            incident = new
            {
                description = claim.IncidentDescription,
                incidentDate = claim.IncidentDate?.ToString("yyyy-MM-dd"),
                incidentType = claim.IncidentType,
            },
            costs = Parse(claim.CostsJson),
            documents = Parse(claim.DocumentsJson),
            review = Parse(claim.ReviewJson),
        });
    }

    /// <summary>Short-code lookup used by the claim-app email ingest to detect customer replies.</summary>
    [HttpGet("api/claims/{shortCode}/ac-id")]
    public async Task<IActionResult> LookupAcId(string shortCode, CancellationToken ct)
    {
        var acId = await claims.LookupAcClaimIdAsync(shortCode, ct);
        return acId is null ? NotFound() : Ok(new { acClaimId = acId });
    }

    /// <summary>Reserves a unique short code. Called by the claim app's wizard before submitting to AC.</summary>
    [HttpPost("api/claims/reserve-code")]
    public async Task<IActionResult> ReserveCode(CancellationToken ct)
    {
        var code = await claims.GenerateUniqueCodeAsync(ct);
        return Ok(new { shortCode = code });
    }
}
