// -----------------------------------------------------------------------------
// File: User.cs
// Purpose: MongoDB document model for the "Users" collection. Represents
//          Backoffice staff, Grid Operator staff, and Prosumer accounts in a
//          single role-discriminated collection.
// Module owner: Member A (Identity & Access)
// -----------------------------------------------------------------------------
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SolarMicrogrid.Api.Models;

public enum UserType
{
    Backoffice,
    GridOperator,
    Prosumer
}

public enum UserStatus
{
    PendingActivation,
    Active,
    Deactivated
}

public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public UserType UserType { get; set; }

    // Shared identity fields
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;

    // Staff (Backoffice / GridOperator) login fields
    public string? Username { get; set; }
    public string? PasswordHash { get; set; }

    // Prosumer fields — NIC is the prosumer's natural primary key
    public string? Nic { get; set; }
    public string? Address { get; set; }
    public string? PhotoUrl { get; set; }

    public UserStatus Status { get; set; } = UserStatus.Active;

    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
