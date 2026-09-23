// -----------------------------------------------------------------------------
// File: ProsumerDtos.cs
// Purpose: Request payloads for prosumer self-registration (mobile) and
//          self-service profile edits.
// Module owner: Member A (Identity & Access)
// -----------------------------------------------------------------------------
namespace SolarMicrogrid.Api.Dtos;

public class RegisterProsumerRequest
{
    public string Nic { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class UpdateProsumerRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
}
