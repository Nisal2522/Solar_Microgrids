// -----------------------------------------------------------------------------
// File: QrTokenService.cs
// Purpose: Generates and verifies the secure transaction QR token embedded
//          in an approved reservation, so the Grid Operator app can confirm
//          a scanned code was genuinely issued by this server and matches
//          the reservation being finalised.
// Module owner: Member D (Grid Operator Verification)
// -----------------------------------------------------------------------------
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;

namespace SolarMicrogrid.Api.Common;

public class QrTokenService
{
    private readonly JwtSettings _settings;

    public QrTokenService(IOptions<JwtSettings> settings)
    {
        _settings = settings.Value;
    }

    // Builds a "reservationId.signature" token unique to this reservation.
    public string GenerateToken(string reservationId, string reservationCode)
    {
        var payload = $"{reservationId}:{reservationCode}";
        var signature = Sign(payload);
        return $"{payload}.{signature}";
    }

    // Verifies a scanned token's signature and returns the embedded reservationId, or null if invalid.
    public string? ValidateAndExtractReservationId(string token)
    {
        var lastDot = token.LastIndexOf('.');
        if (lastDot <= 0) return null;

        var payload = token[..lastDot];
        var signature = token[(lastDot + 1)..];

        if (Sign(payload) != signature) return null;

        var parts = payload.Split(':');
        return parts.Length == 2 ? parts[0] : null;
    }

    // Computes an HMAC-SHA256 signature of the payload using the shared JWT key.
    private string Sign(string payload)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_settings.Key));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(hash);
    }
}
