using MongoDB.Driver;
using SolarMicrogrid.Api.Common;
using SolarMicrogrid.Api.Data;
using SolarMicrogrid.Api.Dtos;
using SolarMicrogrid.Api.Models;

namespace SolarMicrogrid.Api.Services;

public class SlotService
{
    private readonly MongoDbContext _db;

    public SlotService(MongoDbContext db)
    {
        _db = db;
    }

    // Creates a new bookable slot for a station.
    public async Task<SlotResponse> CreateAsync(string stationId, CreateSlotRequest request)
    {
        var stationExists = await _db.Stations.Find(s => s.Id == stationId).AnyAsync();
        if (!stationExists)
        {
            throw new AppException("Station not found.", 404);
        }

        var slot = new EnergyBookingSlot
        {
            StationId = stationId,
            Date = request.Date,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            SlotType = request.SlotType,
            CapacityTotal = request.CapacityTotal,
            CapacityAvailable = request.CapacityTotal,
            Status = SlotStatus.Open
        };

        await _db.BookingSlots.InsertOneAsync(slot);
        return SlotResponse.FromModel(slot);
    }

    // Lists all slots for a station.
    public async Task<List<SlotResponse>> GetByStationAsync(string stationId)
    {
        var slots = await _db.BookingSlots.Find(s => s.StationId == stationId).ToListAsync();
        return slots.Select(SlotResponse.FromModel).ToList();
    }

    // Generates one bookable slot per day that matches the station's weekly
    // schedule, for the next `days` days. Safe to call repeatedly — dates that
    // already have a slot are skipped, so this also tops up the rolling window
    // as time passes. Returns how many new slots were created.
    public async Task<int> GenerateFromScheduleAsync(SolarStation station, int days = 14)
    {
        if (station.Schedule.Count == 0)
        {
            return 0;
        }

        var today = DateTime.UtcNow.Date;
        var existingDates = (await _db.BookingSlots.Find(s => s.StationId == station.Id).ToListAsync())
            .Select(s => s.Date.Date)
            .ToHashSet();

        var newSlots = new List<EnergyBookingSlot>();
        for (var offset = 0; offset < days; offset++)
        {
            var date = today.AddDays(offset);
            if (existingDates.Contains(date))
            {
                continue;
            }

            var scheduleEntry = station.Schedule.FirstOrDefault(e => e.Day == date.DayOfWeek.ToString());
            if (scheduleEntry == null)
            {
                continue;
            }

            newSlots.Add(new EnergyBookingSlot
            {
                StationId = station.Id!,
                Date = date,
                StartTime = scheduleEntry.OpenTime,
                EndTime = scheduleEntry.CloseTime,
                SlotType = SlotType.Charging,
                CapacityTotal = station.TotalBatterySlots,
                CapacityAvailable = station.TotalBatterySlots,
                Status = SlotStatus.Open
            });
        }

        if (newSlots.Count > 0)
        {
            await _db.BookingSlots.InsertManyAsync(newSlots);
        }
        return newSlots.Count;
    }

    // Fetches a slot by id or throws a 404 AppException.
    internal async Task<EnergyBookingSlot> GetByIdOrThrow(string id)
    {
        return await _db.BookingSlots.Find(s => s.Id == id).FirstOrDefaultAsync()
            ?? throw new AppException("Booking slot not found.", 404);
    }

    // Decrements available capacity by one when a reservation is placed; flips to Full at zero.
    internal async Task ReserveCapacityAsync(EnergyBookingSlot slot)
    {
        if (slot.CapacityAvailable <= 0)
        {
            throw new AppException("This slot is fully booked.");
        }

        slot.CapacityAvailable -= 1;
        slot.Status = slot.CapacityAvailable == 0 ? SlotStatus.Full : SlotStatus.Open;
        slot.UpdatedAt = DateTime.UtcNow;
        await _db.BookingSlots.ReplaceOneAsync(s => s.Id == slot.Id, slot);
    }

    // Restores one unit of capacity when a reservation is cancelled.
    internal async Task ReleaseCapacityAsync(EnergyBookingSlot slot)
    {
        slot.CapacityAvailable = Math.Min(slot.CapacityAvailable + 1, slot.CapacityTotal);
        slot.Status = SlotStatus.Open;
        slot.UpdatedAt = DateTime.UtcNow;
        await _db.BookingSlots.ReplaceOneAsync(s => s.Id == slot.Id, slot);
    }
}
