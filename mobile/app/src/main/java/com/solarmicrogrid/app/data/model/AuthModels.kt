// -----------------------------------------------------------------------------
// File: AuthModels.kt
// Purpose: Request/response data classes for the shared login endpoint and
//          the account-management payloads (register/update/error body),
//          mirroring the API's Dtos/AuthDtos.cs, ProsumerDtos.cs, UserDtos.cs.
// Module owner: Member A (Identity & Access)
// -----------------------------------------------------------------------------
package com.solarmicrogrid.app.data.model

data class LoginRequest(
    val identifier: String,
    val password: String
)

data class LoginResponse(
    val token: String,
    val userId: String,
    val userType: String,
    val fullName: String,
    val nic: String?
)

data class RegisterProsumerRequest(
    val nic: String,
    val fullName: String,
    val email: String,
    val phone: String,
    val address: String,
    val password: String
)

data class UpdateProsumerRequest(
    val fullName: String,
    val email: String,
    val phone: String,
    val address: String
)

data class UserResponse(
    val id: String,
    val userType: String,
    val fullName: String,
    val email: String,
    val phone: String,
    val username: String?,
    val nic: String?,
    val address: String?,
    val photoUrl: String?,
    val status: String,
    val createdAt: String
)

// Shape of the JSON error body written by the API's GlobalExceptionMiddleware.
data class ApiErrorBody(
    val message: String?
)
