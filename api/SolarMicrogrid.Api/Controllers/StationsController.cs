// -----------------------------------------------------------------------------
// File: StationsController.cs
// Purpose: Microgrid node (solar station) CRUD for Backoffice, plus the
//          public nearby-stations query used by the mobile map screen.
// Module owner: Member B (Microgrid Nodes & Maps)
// -----------------------------------------------------------------------------
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SolarMicrogrid.Api.Dtos;
using SolarMicrogrid.Api.Services;

namespace SolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/stations")]
public class StationsController : ControllerBase
{
    private readonly StationService _stationService;

    public StationsController(StationService stationService)
    {
        _stationService = stationService;
    }

    // Creates a new microgrid node (Backoffice only).
    [HttpPost]
    [Authorize(Roles = "Backoffice")]
    public async Task<ActionResult<StationResponse>> Create(CreateStationRequest request)
    {
        var createdBy = User.FindFirst("fullName")?.Value ?? "Backoffice";
        return Ok(await _stationService.CreateAsync(request, createdBy));
    }

    // Lists all stations (any authenticated user).
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<StationResponse>>> GetAll()
    {
        return Ok(await _stationService.GetAllAsync());
    }

    // Returns active stations within radiusKm of a GPS point, for the mobile map.
    [HttpGet("nearby")]
    [Authorize]
    public async Task<ActionResult<List<StationResponse>>> GetNearby([FromQuery] double lat, [FromQuery] double lng, [FromQuery] double radiusKm = 25)
    {
        return Ok(await _stationService.GetNearbyAsync(lat, lng, radiusKm));
    }

    // Retrieves a single station by id.
    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<StationResponse>> GetById(string id)
    {
        return Ok(await _stationService.GetByIdAsync(id));
    }

    // Updates a station's details, capacity and schedule (Backoffice only).
    [HttpPut("{id}")]
    [Authorize(Roles = "Backoffice")]
    public async Task<ActionResult<StationResponse>> Update(string id, UpdateStationRequest request)
    {
        return Ok(await _stationService.UpdateAsync(id, request));
    }

    // Deactivates a station, blocked if active reservations exist (Backoffice only).
    [HttpPut("{id}/deactivate")]
    [Authorize(Roles = "Backoffice")]
    public async Task<ActionResult<StationResponse>> Deactivate(string id)
    {
        return Ok(await _stationService.DeactivateAsync(id));
    }

    // Tops up bookable slots from the station's schedule (Backoffice/GridOperator only).
    [HttpPost("{id}/generate-slots")]
    [Authorize(Roles = "Backoffice,GridOperator")]
    public async Task<ActionResult<GenerateSlotsResponse>> GenerateSlots(string id)
    {
        var created = await _stationService.GenerateSlotsAsync(id);
        return Ok(new GenerateSlotsResponse { Created = created });
    }
}
