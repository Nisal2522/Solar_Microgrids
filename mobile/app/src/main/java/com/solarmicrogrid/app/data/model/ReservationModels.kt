// -----------------------------------------------------------------------------
// File: ReservationModels.kt
// Purpose: Request/response data classes for the reservation workflow (create,
//          update, cancel, approve, QR verify/complete) and the dashboard
//          aggregations, mirroring the API's ReservationDtos.cs.
// Module owner: Member C (Reservations & Booking Workflow) /
//               Member D (QR verification)
// -----------------------------------------------------------------------------
package com.solarmicrogrid.app.data.model

data class CreateReservationRequest(
    val prosumerNic: String? = null,
    val stationId: String,
    val slotId: String,
    val scheduledDateTime: String,
    val energyAmountKWh: Double
)

data class UpdateReservationRequest(
    val slotId: String,
    val scheduledDateTime: String,
    val energyAmountKWh: Double
)

data class CancelReservationRequest(
    val reason: String
)

data class VerifyQrRequest(
    val qrToken: String
)

data class ReservationResponse(
    val id: String,
    val reservationCode: String,
    val prosumerNic: String,
    val stationId: String,
    val slotId: String,
    val scheduledDateTime: String,
    val energyAmountKWh: Double,
    val status: String,
    val qrToken: String?,
    val createdAt: String
)

data class ProsumerDashboardResponse(
    val activeCount: Int,
    val pendingCount: Int,
    val upcomingReservations: List<ReservationResponse>
)

data class OperatorDashboardResponse(
    val pendingReservationsCount: Int,
    val approvedFutureReservationsCount: Int,
    val pendingReservations: List<ReservationResponse>
)
