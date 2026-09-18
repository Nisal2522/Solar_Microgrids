// -----------------------------------------------------------------------------
// File: AuthController.cs
// Purpose: Exposes the single shared login endpoint used by both the web
//          app and the mobile app.
// Module owner: Member A (Identity & Access)
// -----------------------------------------------------------------------------
using Microsoft.AspNetCore.Mvc;
using SolarMicrogrid.Api.Dtos;
using SolarMicrogrid.Api.Services;

namespace SolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    // Authenticates a staff (username) or prosumer (NIC) account and returns a JWT.
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        return Ok(result);
    }
}
