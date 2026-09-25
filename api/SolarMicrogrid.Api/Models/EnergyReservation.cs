using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SolarMicrogrid.Api.Models;

public enum ReservationStatus
{
    Pending,
    Approved,
    Completed,
    Cancelled
}

public class EnergyReservation
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string ReservationCode { get; set; } = string.Empty;
    public string ProsumerNic { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string StationId { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string SlotId { get; set; } = string.Empty;

    public DateTime ScheduledDateTime { get; set; }
    public double EnergyAmountKWh { get; set; }

    public ReservationStatus Status { get; set; } = ReservationStatus.Pending;

    public string? QrToken { get; set; }

    public DateTime? CancelledAt { get; set; }
    public string? CancelReason { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
