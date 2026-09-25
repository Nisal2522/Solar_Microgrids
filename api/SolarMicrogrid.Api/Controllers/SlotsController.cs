using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SolarMicrogrid.Api.Dtos;
using SolarMicrogrid.Api.Services;

namespace SolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/stations/{stationId}/slots")]
[Authorize]
public class SlotsController : ControllerBase
{
    private readonly SlotService _slotService;

    public SlotsController(SlotService slotService)
    {
        _slotService = slotService;
    }

    // Generates a new bookable slot for the station (Backoffice/GridOperator only).
    [HttpPost]
    [Authorize(Roles = "Backoffice,GridOperator")]
    public async Task<ActionResult<SlotResponse>> Create(string stationId, CreateSlotRequest request)
    {
        return Ok(await _slotService.CreateAsync(stationId, request));
    }

    // Lists all slots for the station, so prosumers can pick one when booking.
    [HttpGet]
    public async Task<ActionResult<List<SlotResponse>>> GetByStation(string stationId)
    {
        return Ok(await _slotService.GetByStationAsync(stationId));
    }
}
