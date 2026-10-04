// -----------------------------------------------------------------------------
// File: DashboardController.cs
// Purpose: Aggregated dashboard endpoints — active/pending counts and
//          upcoming bookings for the prosumer mobile dashboard, and the
//          pending queue + approved-future count for the Grid Operator
//          dashboard.
// Module owner: Member C (prosumer dashboard) / Member D (operator dashboard)
// -----------------------------------------------------------------------------
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

    // Injects the reservation service that builds the dashboard summaries.
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

    // Returns the Grid Operator dashboard summary.
    [HttpGet("operator")]
    [Authorize(Roles = "Backoffice,GridOperator")]
    public async Task<ActionResult<OperatorDashboardResponse>> GetOperatorDashboard()
    {
        return Ok(await _reservationService.GetOperatorDashboardAsync());
    }
}
