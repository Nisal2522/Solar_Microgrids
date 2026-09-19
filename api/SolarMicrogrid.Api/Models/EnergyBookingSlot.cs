using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SolarMicrogrid.Api.Models;

public enum SlotType
{
    Charging,
    DropOff
}

public enum SlotStatus
{
    Open,
    Full,
    Closed
}

public class EnergyBookingSlot
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string StationId { get; set; } = string.Empty;

    public DateTime Date { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public SlotType SlotType { get; set; }

    public int CapacityTotal { get; set; }
    public int CapacityAvailable { get; set; }

    public SlotStatus Status { get; set; } = SlotStatus.Open;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
