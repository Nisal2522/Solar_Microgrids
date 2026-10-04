// -----------------------------------------------------------------------------
// File: ReservationsController.cs
// Purpose: Create/update/cancel reservations (Prosumer self-service via
//          mobile, or Backoffice/GridOperator on a prosumer's behalf via
//          web), plus the approve, QR-verify and complete workflow used by
//          Grid Operators.
// Module owner: Member C (create/update/cancel/history) /
//               Member D (approve/verify-qr/complete)
// -----------------------------------------------------------------------------
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SolarMicrogrid.Api.Dtos;
using SolarMicrogrid.Api.Services;

namespace SolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/reservations")]
[Authorize]
public class ReservationsController : ControllerBase
{
    private readonly ReservationService _reservationService;

    // Injects the reservation service.
    public ReservationsController(ReservationService reservationService)
    {
        _reservationService = reservationService;
    }

    // Retrieves a single reservation by id (used by the mobile detail/edit screens).
    [HttpGet("{id}")]
    public async Task<ActionResult<ReservationResponse>> GetById(string id)
    {
        return Ok(await _reservationService.GetByIdAsync(id));
    }

    // Creates a reservation; Prosumers book for themselves, staff book on a prosumer's behalf.
    [HttpPost]
    public async Task<ActionResult<ReservationResponse>> Create(CreateReservationRequest request)
    {
        var callerNic = User.IsInRole("Prosumer") ? User.FindFirst("nic")?.Value : null;
        return Ok(await _reservationService.CreateAsync(callerNic, request));
    }

    // Updates a reservation's slot/time/amount (12-hour notice rule enforced by the service).
    [HttpPut("{id}")]
    public async Task<ActionResult<ReservationResponse>> Update(string id, UpdateReservationRequest request)
    {
        var callerNic = User.IsInRole("Prosumer") ? User.FindFirst("nic")?.Value : null;
        return Ok(await _reservationService.UpdateAsync(id, callerNic, request));
    }

    // Cancels a reservation and frees its slot capacity (12-hour notice rule enforced by the service).
    [HttpPut("{id}/cancel")]
    public async Task<ActionResult<ReservationResponse>> Cancel(string id, CancelReservationRequest request)
    {
        var callerNic = User.IsInRole("Prosumer") ? User.FindFirst("nic")?.Value : null;
        return Ok(await _reservationService.CancelAsync(id, callerNic, request));
    }

    // Grid Operator/Backoffice approves a pending reservation, issuing its QR token.
    [HttpPut("{id}/approve")]
    [Authorize(Roles = "Backoffice,GridOperator")]
    public async Task<ActionResult<ReservationResponse>> Approve(string id)
    {
        var approvedBy = User.FindFirst("fullName")?.Value ?? "Operator";
        return Ok(await _reservationService.ApproveAsync(id, approvedBy));
    }

    // Grid Operator scans a prosumer's QR code; verifies it against the server record.
    [HttpPost("verify-qr")]
    [Authorize(Roles = "GridOperator")]
    public async Task<ActionResult<ReservationResponse>> VerifyQr(VerifyQrRequest request)
    {
        return Ok(await _reservationService.VerifyQrAsync(request));
    }

    // Grid Operator finalises the energy transfer after a successful QR verification.
    [HttpPut("{id}/complete")]
    [Authorize(Roles = "GridOperator")]
    public async Task<ActionResult<ReservationResponse>> Complete(string id)
    {
        var completedBy = User.FindFirst("fullName")?.Value ?? "Operator";
        return Ok(await _reservationService.CompleteAsync(id, completedBy));
    }

    // Lists a prosumer's full booking history (self, or Backoffice/GridOperator looking it up).
    [HttpGet("prosumer/{nic}")]
    public async Task<ActionResult<List<ReservationResponse>>> GetByProsumer(string nic)
    {
        return Ok(await _reservationService.GetByProsumerAsync(nic));
    }

    // Lists all reservations awaiting approval.
    [HttpGet("pending")]
    [Authorize(Roles = "Backoffice,GridOperator")]
    public async Task<ActionResult<List<ReservationResponse>>> GetPending()
    {
        return Ok(await _reservationService.GetPendingAsync());
    }
}
