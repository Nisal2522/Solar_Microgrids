// -----------------------------------------------------------------------------
// File: UserService.cs
// Purpose: Backoffice-only staff account management (create Backoffice /
//          Grid Operator users), plus the pending-activation review queue
//          and activate/deactivate/reactivate workflow shared by staff and
//          prosumer accounts.
// Module owner: Member A (Identity & Access)
// -----------------------------------------------------------------------------
using MongoDB.Driver;
using SolarMicrogrid.Api.Common;
using SolarMicrogrid.Api.Data;
using SolarMicrogrid.Api.Dtos;
using SolarMicrogrid.Api.Models;

namespace SolarMicrogrid.Api.Services;

public class UserService
{
    private readonly MongoDbContext _db;

    public UserService(MongoDbContext db)
    {
        _db = db;
    }

    // Creates a Backoffice or Grid Operator staff account (active immediately).
    public async Task<UserResponse> CreateStaffUserAsync(CreateStaffUserRequest request, string createdBy)
    {
        if (request.UserType == UserType.Prosumer)
        {
            throw new AppException("Use the prosumer registration endpoint for Prosumer accounts.");
        }

        var exists = await _db.Users.Find(u => u.Username == request.Username).AnyAsync();
        if (exists)
        {
            throw new AppException("Username is already taken.");
        }

        var user = new User
        {
            UserType = request.UserType,
            FullName = request.FullName,
            Email = request.Email,
            Phone = request.Phone,
            Username = request.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Status = UserStatus.Active,
            CreatedBy = createdBy
        };

        await _db.Users.InsertOneAsync(user);
        return UserResponse.FromModel(user);
    }

    // Lists all staff (Backoffice/GridOperator) accounts for the admin screen.
    public async Task<List<UserResponse>> GetStaffUsersAsync()
    {
        var filter = Builders<User>.Filter.In(u => u.UserType, new[] { UserType.Backoffice, UserType.GridOperator });
        var users = await _db.Users.Find(filter).ToListAsync();
        return users.Select(UserResponse.FromModel).ToList();
    }

    // Returns every account (staff or prosumer) awaiting Backoffice activation.
    public async Task<List<UserResponse>> GetPendingActivationsAsync()
    {
        var users = await _db.Users.Find(u => u.Status == UserStatus.PendingActivation).ToListAsync();
        return users.Select(UserResponse.FromModel).ToList();
    }

    // Approves a pending account, moving it to Active.
    public async Task<UserResponse> ApproveAsync(string id)
    {
        var user = await GetByIdOrThrow(id);
        user.Status = UserStatus.Active;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.Users.ReplaceOneAsync(u => u.Id == id, user);
        return UserResponse.FromModel(user);
    }

    // Deactivates an account (Backoffice-initiated or approving a prosumer's own request).
    public async Task<UserResponse> DeactivateAsync(string id)
    {
        var user = await GetByIdOrThrow(id);
        user.Status = UserStatus.Deactivated;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.Users.ReplaceOneAsync(u => u.Id == id, user);
        return UserResponse.FromModel(user);
    }

    // Reactivates a deactivated account — Backoffice officers only (enforced by controller authorization).
    public async Task<UserResponse> ReactivateAsync(string id)
    {
        var user = await GetByIdOrThrow(id);
        if (user.Status != UserStatus.Deactivated)
        {
            throw new AppException("Only deactivated accounts can be reactivated.");
        }
        user.Status = UserStatus.Active;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.Users.ReplaceOneAsync(u => u.Id == id, user);
        return UserResponse.FromModel(user);
    }

    // Fetches a user by id or throws a 404 AppException.
    private async Task<User> GetByIdOrThrow(string id)
    {
        return await _db.Users.Find(u => u.Id == id).FirstOrDefaultAsync()
            ?? throw new AppException("User not found.", 404);
    }
}
