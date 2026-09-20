// -----------------------------------------------------------------------------
// File: UsersController.cs
// Purpose: Backoffice-only endpoints for staff user creation, the pending
//          activation queue, and activate/deactivate/reactivate actions.
// Module owner: Member A (Identity & Access)
// -----------------------------------------------------------------------------
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SolarMicrogrid.Api.Dtos;
using SolarMicrogrid.Api.Services;

namespace SolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Backoffice")]
public class UsersController : ControllerBase
{
    private readonly UserService _userService;

    public UsersController(UserService userService)
    {
        _userService = userService;
    }

    // Creates a new Backoffice or Grid Operator staff account.
    [HttpPost]
    public async Task<ActionResult<UserResponse>> Create(CreateStaffUserRequest request)
    {
        var createdBy = User.FindFirstValue("fullName") ?? "Backoffice";
        var result = await _userService.CreateStaffUserAsync(request, createdBy);
        return Ok(result);
    }

    // Lists all staff (Backoffice/GridOperator) accounts.
    [HttpGet]
    public async Task<ActionResult<List<UserResponse>>> GetAll()
    {
        return Ok(await _userService.GetStaffUsersAsync());
    }

    // Lists accounts (staff or prosumer) awaiting activation.
    [HttpGet("pending")]
    public async Task<ActionResult<List<UserResponse>>> GetPending()
    {
        return Ok(await _userService.GetPendingActivationsAsync());
    }

    // Approves a pending account.
    [HttpPut("{id}/approve")]
    public async Task<ActionResult<UserResponse>> Approve(string id)
    {
        return Ok(await _userService.ApproveAsync(id));
    }

    // Deactivates an account.
    [HttpPut("{id}/deactivate")]
    public async Task<ActionResult<UserResponse>> Deactivate(string id)
    {
        return Ok(await _userService.DeactivateAsync(id));
    }

    // Reactivates a previously deactivated account.
    [HttpPut("{id}/reactivate")]
    public async Task<ActionResult<UserResponse>> Reactivate(string id)
    {
        return Ok(await _userService.ReactivateAsync(id));
    }
}
