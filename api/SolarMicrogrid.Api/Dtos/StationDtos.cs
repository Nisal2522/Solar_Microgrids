// -----------------------------------------------------------------------------
// File: StationDtos.cs
// Purpose: Request/response payloads for microgrid node (SolarStationInfo)
//          management and the nearby-stations map query.
// Module owner: Member B (Microgrid Nodes & Maps)
// -----------------------------------------------------------------------------
using SolarMicrogrid.Api.Models;

namespace SolarMicrogrid.Api.Dtos;

public class CreateStationRequest
{
    public string StationName { get; set; } = string.Empty;
    public double Lat { get; set; }
    public double Lng { get; set; }
    public double CapacityKWh { get; set; }
    public int TotalBatterySlots { get; set; }
    public List<ScheduleEntry> Schedule { get; set; } = new();
}

public class UpdateStationRequest
{
    public string StationName { get; set; } = string.Empty;
    public double Lat { get; set; }
    public double Lng { get; set; }
    public double CapacityKWh { get; set; }
    public int TotalBatterySlots { get; set; }
    public int AvailableBatterySlots { get; set; }
    public List<ScheduleEntry> Schedule { get; set; } = new();
}

public class StationResponse
{
    public string Id { get; set; } = string.Empty;
    public string StationName { get; set; } = string.Empty;
    public double Lat { get; set; }
    public double Lng { get; set; }
    public double CapacityKWh { get; set; }
    public int TotalBatterySlots { get; set; }
    public int AvailableBatterySlots { get; set; }
    public List<ScheduleEntry> Schedule { get; set; } = new();
    public StationStatus Status { get; set; }

    // Maps a SolarStation document to the response shape.
    public static StationResponse FromModel(SolarStation s) => new()
    {
        Id = s.Id ?? string.Empty,
        StationName = s.StationName,
        Lat = s.GpsLocation.Lat,
        Lng = s.GpsLocation.Lng,
        CapacityKWh = s.CapacityKWh,
        TotalBatterySlots = s.TotalBatterySlots,
        AvailableBatterySlots = s.AvailableBatterySlots,
        Schedule = s.Schedule,
        Status = s.Status
    };
}

public class GenerateSlotsResponse
{
    public int Created { get; set; }
}
