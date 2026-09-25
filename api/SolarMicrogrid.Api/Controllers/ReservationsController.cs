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

    // Lists a prosumer's full booking history (self, or Backoffice/GridOperator looking it up).
    [HttpGet("prosumer/{nic}")]
    public async Task<ActionResult<List<ReservationResponse>>> GetByProsumer(string nic)
    {
        return Ok(await _reservationService.GetByProsumerAsync(nic));
    }
}
