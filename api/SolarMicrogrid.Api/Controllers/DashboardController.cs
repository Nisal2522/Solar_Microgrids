using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SolarMicrogrid.Api.Dtos;
using SolarMicrogrid.Api.Services;

namespace SolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ReservationService _reservationService;

    public DashboardController(ReservationService reservationService)
    {
        _reservationService = reservationService;
    }

    // Returns a prosumer's mobile dashboard summary.
    [HttpGet("prosumer/{nic}")]
    public async Task<ActionResult<ProsumerDashboardResponse>> GetProsumerDashboard(string nic)
    {
        return Ok(await _reservationService.GetProsumerDashboardAsync(nic));
    }
}
