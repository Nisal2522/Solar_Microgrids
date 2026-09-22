using SolarMicrogrid.Api.Models;

namespace SolarMicrogrid.Api.Dtos;

public class CreateReservationRequest
{
    // Only required when a Backoffice/GridOperator creates a booking on a prosumer's behalf;
    // ignored (the caller's own NIC is used) when a Prosumer creates their own booking.
    public string? ProsumerNic { get; set; }
    public string StationId { get; set; } = string.Empty;
    public string SlotId { get; set; } = string.Empty;
    public DateTime ScheduledDateTime { get; set; }
    public double EnergyAmountKWh { get; set; }
}

public class UpdateReservationRequest
{
    public string SlotId { get; set; } = string.Empty;
    public DateTime ScheduledDateTime { get; set; }
    public double EnergyAmountKWh { get; set; }
}

public class CancelReservationRequest
{
    public string Reason { get; set; } = string.Empty;
}

public class ReservationResponse
{
    public string Id { get; set; } = string.Empty;
    public string ReservationCode { get; set; } = string.Empty;
    public string ProsumerNic { get; set; } = string.Empty;
    public string StationId { get; set; } = string.Empty;
    public string SlotId { get; set; } = string.Empty;
    public DateTime ScheduledDateTime { get; set; }
    public double EnergyAmountKWh { get; set; }
    public ReservationStatus Status { get; set; }
    public string? QrToken { get; set; }
    public DateTime CreatedAt { get; set; }

    // Maps an EnergyReservation document to the response shape.
    public static ReservationResponse FromModel(EnergyReservation r) => new()
    {
        Id = r.Id ?? string.Empty,
        ReservationCode = r.ReservationCode,
        ProsumerNic = r.ProsumerNic,
        StationId = r.StationId,
        SlotId = r.SlotId,
        ScheduledDateTime = r.ScheduledDateTime,
        EnergyAmountKWh = r.EnergyAmountKWh,
        Status = r.Status,
        QrToken = r.QrToken,
        CreatedAt = r.CreatedAt
    };
}

public class ProsumerDashboardResponse
{
    public int ActiveCount { get; set; }
    public int PendingCount { get; set; }
    public List<ReservationResponse> UpcomingReservations { get; set; } = new();
}
