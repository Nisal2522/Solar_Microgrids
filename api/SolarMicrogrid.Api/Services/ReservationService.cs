// -----------------------------------------------------------------------------
// File: ReservationService.cs
// Purpose: Core power-trading reservation workflow — create (within a 7-day
//          window), update/cancel (at least 12 hours' notice), approve, QR
//          verification + completion, and the prosumer/operator dashboard
//          aggregations. All rule enforcement lives here (FAT-service).
// Module owner: Member C (create/update/cancel/dashboards) /
//               Member D (approve/verify-qr/complete)
// -----------------------------------------------------------------------------
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

    // Injects the database context, slot capacity service and QR token service.
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

    // Grid Operator/Backoffice approves a Pending reservation and issues its QR token.
    public async Task<ReservationResponse> ApproveAsync(string id, string approvedBy)
    {
        var reservation = await GetByIdOrThrow(id);
        if (reservation.Status != ReservationStatus.Pending)
        {
            throw new AppException("Only pending reservations can be approved.");
        }

        reservation.Status = ReservationStatus.Approved;
        reservation.ApprovedBy = approvedBy;
        reservation.ApprovedAt = DateTime.UtcNow;
        reservation.QrToken = _qrTokenService.GenerateToken(reservation.Id!, reservation.ReservationCode);
        reservation.UpdatedAt = DateTime.UtcNow;

        await _db.Reservations.ReplaceOneAsync(r => r.Id == id, reservation);
        return ReservationResponse.FromModel(reservation);
    }

    // Grid Operator scans a QR code; verifies its signature and returns the matching reservation.
    public async Task<ReservationResponse> VerifyQrAsync(VerifyQrRequest request)
    {
        var reservationId = _qrTokenService.ValidateAndExtractReservationId(request.QrToken)
            ?? throw new AppException("Invalid or tampered QR code.");

        var reservation = await GetByIdOrThrow(reservationId);

        if (reservation.QrToken != request.QrToken)
        {
            throw new AppException("QR code does not match the reservation record.");
        }

        if (reservation.Status != ReservationStatus.Approved)
        {
            throw new AppException("Reservation is not in an approved, ready-to-transfer state.");
        }

        return ReservationResponse.FromModel(reservation);
    }

    // Grid Operator finalises the energy transfer after a successful QR verification.
    public async Task<ReservationResponse> CompleteAsync(string id, string completedBy)
    {
        var reservation = await GetByIdOrThrow(id);
        if (reservation.Status != ReservationStatus.Approved)
        {
            throw new AppException("Only approved reservations can be completed.");
        }

        reservation.Status = ReservationStatus.Completed;
        reservation.CompletedBy = completedBy;
        reservation.CompletedAt = DateTime.UtcNow;
        reservation.UpdatedAt = DateTime.UtcNow;

        await _db.Reservations.ReplaceOneAsync(r => r.Id == id, reservation);
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

    // Lists all reservations awaiting Grid Operator approval.
    public async Task<List<ReservationResponse>> GetPendingAsync()
    {
        var reservations = await _db.Reservations.Find(r => r.Status == ReservationStatus.Pending)
            .SortBy(r => r.ScheduledDateTime).ToListAsync();
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

    // Builds the Grid Operator dashboard: pending queue + count of approved future reservations.
    public async Task<OperatorDashboardResponse> GetOperatorDashboardAsync()
    {
        var reservations = await _db.Reservations.Find(_ => true).ToListAsync();
        var now = DateTime.UtcNow;

        return new OperatorDashboardResponse
        {
            PendingReservationsCount = reservations.Count(r => r.Status == ReservationStatus.Pending),
            ApprovedFutureReservationsCount = reservations.Count(r => r.Status == ReservationStatus.Approved && r.ScheduledDateTime > now),
            PendingReservations = reservations
                .Where(r => r.Status == ReservationStatus.Pending)
                .OrderBy(r => r.ScheduledDateTime)
                .Select(ReservationResponse.FromModel)
                .ToList()
        };
    }

    // Rejects scheduling more than 7 days out, or in the past.
    private static void ValidateWithinBookingWindow(DateTime scheduledDateTime)
    {
        var now = DateTime.UtcNow;
        if (scheduledDateTime < now)
        {
            throw new AppException("Reservation time must be in the future.");
        }
        if (scheduledDateTime > now.AddDays(MaxAdvanceBookingDays))
        {
            throw new AppException($"Reservations can only be scheduled within {MaxAdvanceBookingDays} days.");
        }
    }

    // Rejects update/cancel when less than 12 hours remain before the scheduled time.
    private static void ValidateMinimumNotice(DateTime scheduledDateTime)
    {
        if (scheduledDateTime - DateTime.UtcNow < TimeSpan.FromHours(MinNoticeHours))
        {
            throw new AppException($"Updates and cancellations require at least {MinNoticeHours} hours' notice.");
        }
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
