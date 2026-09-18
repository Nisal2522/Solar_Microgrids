// -----------------------------------------------------------------------------
// File: SolarStation.cs
// Purpose: MongoDB document model for the "SolarStationInfo" collection —
//          the physical microgrid hub/node (GPS location, capacity, battery
//          slots, weekly operating schedule).
// Module owner: Member B (Microgrid Nodes & Maps)
// -----------------------------------------------------------------------------
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SolarMicrogrid.Api.Models;

public enum StationStatus
{
    Active,
    Deactivated
}

public class GpsLocation
{
    public double Lat { get; set; }
    public double Lng { get; set; }
}

public class ScheduleEntry
{
    // Day of week, e.g. "Monday"
    public string Day { get; set; } = string.Empty;
    public string OpenTime { get; set; } = "08:00";
    public string CloseTime { get; set; } = "18:00";
}

public class SolarStation
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string StationName { get; set; } = string.Empty;
    public GpsLocation GpsLocation { get; set; } = new();
    public double CapacityKWh { get; set; }
    public int TotalBatterySlots { get; set; }
    public int AvailableBatterySlots { get; set; }
    public List<ScheduleEntry> Schedule { get; set; } = new();

    public StationStatus Status { get; set; } = StationStatus.Active;

    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
