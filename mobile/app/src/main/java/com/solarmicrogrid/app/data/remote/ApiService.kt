// -----------------------------------------------------------------------------
// File: ApiService.kt
// Purpose: Retrofit interface declaring every REST call the mobile app makes
//          against the Web API. No business logic lives here or anywhere
//          else in the app — every rule (7-day window, 12-hour notice, QR
//          verification) is enforced server-side, per the FAT-service
//          architecture.
// Module owner: shared infrastructure
// -----------------------------------------------------------------------------
package com.solarmicrogrid.app.data.remote

import com.solarmicrogrid.app.data.model.*
import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("prosumers/register")
    suspend fun registerProsumer(@Body request: RegisterProsumerRequest): Response<UserResponse>

    @GET("prosumers/{nic}")
    suspend fun getProsumer(@Path("nic") nic: String): Response<UserResponse>

    @PUT("prosumers/{nic}")
    suspend fun updateProsumer(@Path("nic") nic: String, @Body request: UpdateProsumerRequest): Response<UserResponse>

    @PUT("prosumers/{nic}/request-deactivation")
    suspend fun requestDeactivation(@Path("nic") nic: String): Response<UserResponse>

    @Multipart
    @POST("prosumers/{nic}/photo")
    suspend fun uploadProsumerPhoto(@Path("nic") nic: String, @Part file: MultipartBody.Part): Response<UserResponse>

    @GET("stations")
    suspend fun getStations(): Response<List<StationResponse>>

    @GET("stations/nearby")
    suspend fun getNearbyStations(
        @Query("lat") lat: Double,
        @Query("lng") lng: Double,
        @Query("radiusKm") radiusKm: Double
    ): Response<List<StationResponse>>

    @GET("stations/{stationId}/slots")
    suspend fun getSlots(@Path("stationId") stationId: String): Response<List<SlotResponse>>

    @GET("reservations/{id}")
    suspend fun getReservation(@Path("id") id: String): Response<ReservationResponse>

    @POST("reservations")
    suspend fun createReservation(@Body request: CreateReservationRequest): Response<ReservationResponse>

    @PUT("reservations/{id}")
    suspend fun updateReservation(@Path("id") id: String, @Body request: UpdateReservationRequest): Response<ReservationResponse>

    @PUT("reservations/{id}/cancel")
    suspend fun cancelReservation(@Path("id") id: String, @Body request: CancelReservationRequest): Response<ReservationResponse>

    @GET("reservations/prosumer/{nic}")
    suspend fun getReservationsByProsumer(@Path("nic") nic: String): Response<List<ReservationResponse>>

    @PUT("reservations/{id}/approve")
    suspend fun approveReservation(@Path("id") id: String): Response<ReservationResponse>

    @GET("dashboard/prosumer/{nic}")
    suspend fun getProsumerDashboard(@Path("nic") nic: String): Response<ProsumerDashboardResponse>

    @GET("dashboard/operator")
    suspend fun getOperatorDashboard(): Response<OperatorDashboardResponse>

    @POST("reservations/verify-qr")
    suspend fun verifyQr(@Body request: VerifyQrRequest): Response<ReservationResponse>

    @PUT("reservations/{id}/complete")
    suspend fun completeReservation(@Path("id") id: String): Response<ReservationResponse>
}
