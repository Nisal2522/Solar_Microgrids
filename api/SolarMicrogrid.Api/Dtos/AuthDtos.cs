// -----------------------------------------------------------------------------
// File: AuthDtos.cs
// Purpose: Request/response payloads for the login endpoint shared by the
//          web app (Backoffice/GridOperator) and the mobile app
//          (Prosumer/GridOperator).
// Module owner: Member A (Identity & Access)
// -----------------------------------------------------------------------------
namespace SolarMicrogrid.Api.Dtos;

public class LoginRequest
{
    // Username for staff logins, or NIC for prosumer logins.
    public string Identifier { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserType { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Nic { get; set; }
}
