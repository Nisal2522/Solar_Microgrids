// -----------------------------------------------------------------------------
// File: ApiErrorParser.kt
// Purpose: Extracts a human-readable message from a failed Retrofit
//          Response's error body (the {"message": "..."} JSON written by
//          the API's GlobalExceptionMiddleware).
// Module owner: shared infrastructure
// -----------------------------------------------------------------------------
package com.solarmicrogrid.app.util

import com.google.gson.Gson
import com.solarmicrogrid.app.data.model.ApiErrorBody
import retrofit2.Response

// Reads the error body of a failed response, falling back to a generic message.
fun <T> Response<T>.errorMessageOrDefault(default: String = "Something went wrong. Please try again."): String {
    val body = errorBody()?.string()
    if (body.isNullOrBlank()) return default
    return try {
        Gson().fromJson(body, ApiErrorBody::class.java)?.message ?: default
    } catch (e: Exception) {
        default
    }
}
