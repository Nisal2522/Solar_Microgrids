// -----------------------------------------------------------------------------
// File: StationService.cs
// Purpose: CRUD for microgrid nodes (solar stations), the nearby-stations
//          query used by the mobile map, and the deactivation guard that
//          blocks removal while active energy reservations exist.
// Module owner: Member B (Microgrid Nodes & Maps)
// -----------------------------------------------------------------------------
using MongoDB.Driver;
using SolarMicrogrid.Api.Common;
using SolarMicrogrid.Api.Data;
using SolarMicrogrid.Api.Dtos;
using SolarMicrogrid.Api.Models;

namespace SolarMicrogrid.Api.Services;

public class StationService
{
    private readonly MongoDbContext _db;
    private readonly SlotService _slotService;

    public StationService(MongoDbContext db, SlotService slotService)
    {
        _db = db;
        _slotService = slotService;
    }

    // Creates a new microgrid node/hub and generates its first two weeks of bookable slots.
    public async Task<StationResponse> CreateAsync(CreateStationRequest request, string createdBy)
    {
        var station = new SolarStation
        {
            StationName = request.StationName,
            GpsLocation = new GpsLocation { Lat = request.Lat, Lng = request.Lng },
            CapacityKWh = request.CapacityKWh,
            TotalBatterySlots = request.TotalBatterySlots,
            AvailableBatterySlots = request.TotalBatterySlots,
            Schedule = request.Schedule,
            Status = StationStatus.Active,
            CreatedBy = createdBy
        };

        await _db.Stations.InsertOneAsync(station);
        await _slotService.GenerateFromScheduleAsync(station);
        return StationResponse.FromModel(station);
    }

    // Tops up bookable slots for an existing station from its current schedule
    // (covers stations registered before auto-generation existed, and extends
    // the rolling window as time passes). Returns how many slots were created.
    public async Task<int> GenerateSlotsAsync(string id)
    {
        var station = await GetByIdOrThrow(id);
        return await _slotService.GenerateFromScheduleAsync(station);
    }

    // Lists all stations (active and deactivated) for the Backoffice admin screen.
    public async Task<List<StationResponse>> GetAllAsync()
    {
        var stations = await _db.Stations.Find(_ => true).ToListAsync();
        return stations.Select(StationResponse.FromModel).ToList();
    }

    // Retrieves a single station by id.
    public async Task<StationResponse> GetByIdAsync(string id)
    {
        var station = await GetByIdOrThrow(id);
        return StationResponse.FromModel(station);
    }

    // Updates capacity, battery slot counts and the operating schedule.
    public async Task<StationResponse> UpdateAsync(string id, UpdateStationRequest request)
    {
        var station = await GetByIdOrThrow(id);
        station.StationName = request.StationName;
        station.GpsLocation = new GpsLocation { Lat = request.Lat, Lng = request.Lng };
        station.CapacityKWh = request.CapacityKWh;
        station.TotalBatterySlots = request.TotalBatterySlots;
        station.AvailableBatterySlots = request.AvailableBatterySlots;
        station.Schedule = request.Schedule;
        station.UpdatedAt = DateTime.UtcNow;

        await _db.Stations.ReplaceOneAsync(s => s.Id == id, station);
        return StationResponse.FromModel(station);
    }

    // Deactivates a station, but only if it has no active (Pending/Approved) reservations.
    public async Task<StationResponse> DeactivateAsync(string id)
    {
        var station = await GetByIdOrThrow(id);

        var hasActiveReservations = await _db.Reservations.Find(r =>
            r.StationId == id &&
            (r.Status == ReservationStatus.Pending || r.Status == ReservationStatus.Approved)
        ).AnyAsync();

        if (hasActiveReservations)
        {
            throw new AppException("Cannot deactivate a station with active energy reservations.");
        }

        station.Status = StationStatus.Deactivated;
        station.UpdatedAt = DateTime.UtcNow;
        await _db.Stations.ReplaceOneAsync(s => s.Id == id, station);
        return StationResponse.FromModel(station);
    }

    // Returns active stations within radiusKm of the given point (haversine, in-memory filter).
    public async Task<List<StationResponse>> GetNearbyAsync(double lat, double lng, double radiusKm)
    {
        var stations = await _db.Stations.Find(s => s.Status == StationStatus.Active).ToListAsync();

        var nearby = stations.Where(s => HaversineKm(lat, lng, s.GpsLocation.Lat, s.GpsLocation.Lng) <= radiusKm);
        return nearby.Select(StationResponse.FromModel).ToList();
    }

    // Computes great-circle distance in kilometres between two GPS points.
    private static double HaversineKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double earthRadiusKm = 6371;
        var dLat = DegreesToRadians(lat2 - lat1);
        var dLon = DegreesToRadians(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return earthRadiusKm * c;
    }

    // Converts degrees to radians.
    private static double DegreesToRadians(double degrees) => degrees * Math.PI / 180;

    // Fetches a station by id or throws a 404 AppException.
    private async Task<SolarStation> GetByIdOrThrow(string id)
    {
        return await _db.Stations.Find(s => s.Id == id).FirstOrDefaultAsync()
            ?? throw new AppException("Station not found.", 404);
    }
}
