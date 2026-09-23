// -----------------------------------------------------------------------------
// File: AuthService.cs
// Purpose: Verifies staff (username) and prosumer (NIC) credentials against
//          the Users collection and issues a JWT on success. All login
//          business logic (status checks, password verification) lives here
//          per the FAT-service pattern.
// Module owner: Member A (Identity & Access)
// -----------------------------------------------------------------------------
using MongoDB.Driver;
using SolarMicrogrid.Api.Common;
using SolarMicrogrid.Api.Data;
using SolarMicrogrid.Api.Dtos;
using SolarMicrogrid.Api.Models;

namespace SolarMicrogrid.Api.Services;

public class AuthService
{
    private readonly MongoDbContext _db;
    private readonly JwtTokenService _tokenService;

    public AuthService(MongoDbContext db, JwtTokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    // Authenticates by username (staff) or NIC (prosumer) and returns a signed token.
    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var filter = Builders<User>.Filter.Or(
            Builders<User>.Filter.Eq(u => u.Username, request.Identifier),
            Builders<User>.Filter.Eq(u => u.Nic, request.Identifier));

        var user = await _db.Users.Find(filter).FirstOrDefaultAsync()
            ?? throw new AppException("Invalid credentials.", 401);

        if (string.IsNullOrEmpty(user.PasswordHash) || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new AppException("Invalid credentials.", 401);
        }

        if (user.Status == UserStatus.PendingActivation)
        {
            throw new AppException("Your account is pending Backoffice activation.", 403);
        }

        if (user.Status == UserStatus.Deactivated)
        {
            throw new AppException("Your account has been deactivated. Contact Backoffice to reactivate.", 403);
        }

        var token = _tokenService.GenerateToken(user);

        return new LoginResponse
        {
            Token = token,
            UserId = user.Id ?? string.Empty,
            UserType = user.UserType.ToString(),
            FullName = user.FullName,
            Nic = user.Nic
        };
    }
}
