// -----------------------------------------------------------------------------
// File: JwtTokenService.cs
// Purpose: Issues signed JWT access tokens carrying the user's id, role and
//          (for prosumers) NIC, used by both the web and mobile clients to
//          authenticate subsequent API calls.
// Module owner: Member A (Identity & Access)
// -----------------------------------------------------------------------------
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SolarMicrogrid.Api.Models;

namespace SolarMicrogrid.Api.Common;

public class JwtSettings
{
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpiryMinutes { get; set; } = 480;
}

public class JwtTokenService
{
    private readonly JwtSettings _settings;

    public JwtTokenService(IOptions<JwtSettings> settings)
    {
        _settings = settings.Value;
    }

    // Builds a signed JWT for the given user containing id/role/nic claims.
    public string GenerateToken(User user)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id ?? string.Empty),
            new(ClaimTypes.Role, user.UserType.ToString()),
            new("fullName", user.FullName)
        };

        if (!string.IsNullOrEmpty(user.Nic))
        {
            claims.Add(new Claim("nic", user.Nic));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_settings.ExpiryMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
