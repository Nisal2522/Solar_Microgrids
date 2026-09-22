// -----------------------------------------------------------------------------
// File: ProsumersController.cs
// Purpose: Prosumer self-registration (public) and self-service profile /
//          deactivation-request endpoints (authenticated prosumer only).
// Module owner: Member A (Identity & Access)
// -----------------------------------------------------------------------------
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SolarMicrogrid.Api.Dtos;
using SolarMicrogrid.Api.Services;

namespace SolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/prosumers")]
public class ProsumersController : ControllerBase
{
    private readonly ProsumerService _prosumerService;

    public ProsumersController(ProsumerService prosumerService)
    {
        _prosumerService = prosumerService;
    }

    // Public endpoint: registers a new prosumer from the mobile app (starts PendingActivation).
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<UserResponse>> Register(RegisterProsumerRequest request)
    {
        var result = await _prosumerService.RegisterAsync(request);
        return Ok(result);
    }

    // Retrieves a prosumer profile by NIC.
    [HttpGet("{nic}")]
    [Authorize]
    public async Task<ActionResult<UserResponse>> GetByNic(string nic)
    {
        return Ok(await _prosumerService.GetByNicAsync(nic));
    }

    // Updates the prosumer's own profile.
    [HttpPut("{nic}")]
    [Authorize(Roles = "Prosumer")]
    public async Task<ActionResult<UserResponse>> UpdateProfile(string nic, UpdateProsumerRequest request)
    {
        return Ok(await _prosumerService.UpdateProfileAsync(nic, request));
    }

    // Uploads or replaces the prosumer's profile picture.
    [HttpPost("{nic}/photo")]
    [Authorize(Roles = "Prosumer")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<ActionResult<UserResponse>> UploadPhoto(string nic, IFormFile? file)
    {
        return Ok(await _prosumerService.UploadPhotoAsync(nic, file));
    }

    // Prosumer requests their own account be deactivated.
    [HttpPut("{nic}/request-deactivation")]
    [Authorize(Roles = "Prosumer")]
    public async Task<ActionResult<UserResponse>> RequestDeactivation(string nic)
    {
        return Ok(await _prosumerService.RequestDeactivationAsync(nic));
    }
}
