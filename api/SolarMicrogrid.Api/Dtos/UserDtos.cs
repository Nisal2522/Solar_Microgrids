// -----------------------------------------------------------------------------
// File: UserDtos.cs
// Purpose: Request/response payloads for Backoffice-managed staff user
//          accounts (Backoffice + Grid Operator) and the pending-activation
//          review list.
// Module owner: Member A (Identity & Access)
// -----------------------------------------------------------------------------
using SolarMicrogrid.Api.Models;

namespace SolarMicrogrid.Api.Dtos;

public class CreateStaffUserRequest
{
    public UserType UserType { get; set; } // Backoffice or GridOperator
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class UserResponse
{
    public string Id { get; set; } = string.Empty;
    public UserType UserType { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Username { get; set; }
    public string? Nic { get; set; }
    public string? Address { get; set; }
    public string? PhotoUrl { get; set; }
    public UserStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }

    // Maps a User document to the response shape, hiding the password hash.
    public static UserResponse FromModel(User user) => new()
    {
        Id = user.Id ?? string.Empty,
        UserType = user.UserType,
        FullName = user.FullName,
        Email = user.Email,
        Phone = user.Phone,
        Username = user.Username,
        Nic = user.Nic,
        Address = user.Address,
        PhotoUrl = user.PhotoUrl,
        Status = user.Status,
        CreatedAt = user.CreatedAt
    };
}
