using MongoDB.Driver;
using SolarMicrogrid.Api.Common;
using SolarMicrogrid.Api.Data;
using SolarMicrogrid.Api.Dtos;
using SolarMicrogrid.Api.Models;

namespace SolarMicrogrid.Api.Services;

public class ReservationService
{
    private readonly MongoDbContext _db;
    private readonly SlotService _slotService;
    private readonly QrTokenService _qrTokenService;

    private const int MaxAdvanceBookingDays = 7;
    private const int MinNoticeHours = 12;

    public ReservationService(MongoDbContext db, SlotService slotService, QrTokenService qrTokenService)
    {
        _db = db;
        _slotService = slotService;
        _qrTokenService = qrTokenService;
    }

    // Creates a reservation; enforces the 7-day advance-booking window and slot capacity.
    // callerNic is the authenticated prosumer's NIC, or null when a staff member is booking on
    // a prosumer's behalf (in which case request.ProsumerNic must be supplied).
    public async Task<ReservationResponse> CreateAsync(string? callerNic, CreateReservationRequest request)
    {
        var prosumerNic = callerNic ?? request.ProsumerNic
            ?? throw new AppException("ProsumerNic is required when booking on a prosumer's behalf.");

        ValidateWithinBookingWindow(request.ScheduledDateTime);

        var slot = await _slotService.GetByIdOrThrow(request.SlotId);
        await _slotService.ReserveCapacityAsync(slot);

        var reservation = new EnergyReservation
        {
            ReservationCode = GenerateReservationCode(),
            ProsumerNic = prosumerNic,
            StationId = request.StationId,
            SlotId = request.SlotId,
            ScheduledDateTime = request.ScheduledDateTime,
            EnergyAmountKWh = request.EnergyAmountKWh,
            Status = ReservationStatus.Pending
        };

        await _db.Reservations.InsertOneAsync(reservation);
        return ReservationResponse.FromModel(reservation);
    }

    // Updates a reservation's slot/time/amount; requires at least 12 hours' notice.
    // callerNic is null when a staff member (Backoffice/GridOperator) is performing the update.
    public async Task<ReservationResponse> UpdateAsync(string id, string? callerNic, UpdateReservationRequest request)
    {
        var reservation = callerNic is null
            ? await GetByIdOrThrow(id)
            : await GetOwnedByProsumerOrThrow(id, callerNic);
        ValidateMinimumNotice(reservation.ScheduledDateTime);
        ValidateWithinBookingWindow(request.ScheduledDateTime);

        reservation.SlotId = request.SlotId;
        reservation.ScheduledDateTime = request.ScheduledDateTime;
        reservation.EnergyAmountKWh = request.EnergyAmountKWh;
        reservation.UpdatedAt = DateTime.UtcNow;

        await _db.Reservations.ReplaceOneAsync(r => r.Id == id, reservation);
        return ReservationResponse.FromModel(reservation);
    }

    // Cancels a reservation and releases its slot capacity; requires at least 12 hours' notice.
    // callerNic is null when a staff member (Backoffice/GridOperator) is performing the cancellation.
    public async Task<ReservationResponse> CancelAsync(string id, string? callerNic, CancelReservationRequest request)
    {
        var reservation = callerNic is null
            ? await GetByIdOrThrow(id)
            : await GetOwnedByProsumerOrThrow(id, callerNic);
        ValidateMinimumNotice(reservation.ScheduledDateTime);

        reservation.Status = ReservationStatus.Cancelled;
        reservation.CancelledAt = DateTime.UtcNow;
        reservation.CancelReason = request.Reason;
        reservation.UpdatedAt = DateTime.UtcNow;

        await _db.Reservations.ReplaceOneAsync(r => r.Id == id, reservation);

        var slot = await _slotService.GetByIdOrThrow(reservation.SlotId);
        await _slotService.ReleaseCapacityAsync(slot);

        return ReservationResponse.FromModel(reservation);
    }

    // Retrieves a single reservation by id (mobile detail/edit screens).
    public async Task<ReservationResponse> GetByIdAsync(string id)
    {
        var reservation = await GetByIdOrThrow(id);
        return ReservationResponse.FromModel(reservation);
    }

    // Lists a prosumer's full reservation/booking history.
    public async Task<List<ReservationResponse>> GetByProsumerAsync(string prosumerNic)
    {
        var reservations = await _db.Reservations.Find(r => r.ProsumerNic == prosumerNic)
            .SortByDescending(r => r.ScheduledDateTime).ToListAsync();
        return reservations.Select(ReservationResponse.FromModel).ToList();
    }

    // Builds the prosumer's mobile dashboard: active/pending counts + upcoming bookings.
    public async Task<ProsumerDashboardResponse> GetProsumerDashboardAsync(string prosumerNic)
    {
        var reservations = await _db.Reservations.Find(r => r.ProsumerNic == prosumerNic).ToListAsync();

        return new ProsumerDashboardResponse
        {
            ActiveCount = reservations.Count(r => r.Status == ReservationStatus.Approved),
            PendingCount = reservations.Count(r => r.Status == ReservationStatus.Pending),
            UpcomingReservations = reservations
                .Where(r => r.Status is ReservationStatus.Pending or ReservationStatus.Approved)
                .OrderBy(r => r.ScheduledDateTime)
                .Select(ReservationResponse.FromModel)
                .ToList()
        };
    }

    // Generates a short human-readable reservation code (e.g. RSV-A1B2C3).
    private static string GenerateReservationCode()
    {
        return $"RSV-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
    }

    // Fetches a reservation by id or throws a 404 AppException.
    private async Task<EnergyReservation> GetByIdOrThrow(string id)
    {
        return await _db.Reservations.Find(r => r.Id == id).FirstOrDefaultAsync()
            ?? throw new AppException("Reservation not found.", 404);
    }

    // Fetches a reservation by id, ensuring it belongs to the requesting prosumer.
    private async Task<EnergyReservation> GetOwnedByProsumerOrThrow(string id, string prosumerNic)
    {
        var reservation = await GetByIdOrThrow(id);
        if (reservation.ProsumerNic != prosumerNic)
        {
            throw new AppException("You do not own this reservation.", 403);
        }
        return reservation;
    }
}
