// -----------------------------------------------------------------------------
// File: AuthInterceptor.kt
// Purpose: OkHttp interceptor that attaches the saved JWT (if any) to every
//          outgoing request's Authorization header, so individual API
//          calls never have to handle auth headers themselves.
// Module owner: Member A (Identity & Access)
// -----------------------------------------------------------------------------
package com.solarmicrogrid.app.data.remote

import com.solarmicrogrid.app.data.local.SessionManager
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor(private val sessionManager: SessionManager) : Interceptor {

    // Adds "Authorization: Bearer <token>" to the request when a session exists.
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = sessionManager.current()?.token
        val request = chain.request().newBuilder().apply {
            if (!token.isNullOrEmpty()) {
                addHeader("Authorization", "Bearer $token")
            }
        }.build()
        return chain.proceed(request)
    }
}
