using SolarMicrogrid.Api.Models;

namespace SolarMicrogrid.Api.Dtos;

public class CreateSlotRequest
{
    public DateTime Date { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public SlotType SlotType { get; set; }
    public int CapacityTotal { get; set; }
}

public class SlotResponse
{
    public string Id { get; set; } = string.Empty;
    public string StationId { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public SlotType SlotType { get; set; }
    public int CapacityTotal { get; set; }
    public int CapacityAvailable { get; set; }
    public SlotStatus Status { get; set; }

    // Maps an EnergyBookingSlot document to the response shape.
    public static SlotResponse FromModel(EnergyBookingSlot s) => new()
    {
        Id = s.Id ?? string.Empty,
        StationId = s.StationId,
        Date = s.Date,
        StartTime = s.StartTime,
        EndTime = s.EndTime,
        SlotType = s.SlotType,
        CapacityTotal = s.CapacityTotal,
        CapacityAvailable = s.CapacityAvailable,
        Status = s.Status
    };
}
