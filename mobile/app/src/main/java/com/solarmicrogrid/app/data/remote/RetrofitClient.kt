// -----------------------------------------------------------------------------
// File: RetrofitClient.kt
// Purpose: Builds a single shared Retrofit/OkHttp instance (with the auth
//          interceptor and request logging) pointed at the Web API base URL.
// Module owner: shared infrastructure
// -----------------------------------------------------------------------------
package com.solarmicrogrid.app.data.remote

import android.content.Context
import com.solarmicrogrid.app.data.local.SessionManager
import com.solarmicrogrid.app.util.Constants
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {

    @Volatile
    private var apiService: ApiService? = null

    // Returns the shared ApiService, building it on first use.
    fun getApiService(context: Context): ApiService {
        return apiService ?: synchronized(this) {
            apiService ?: build(context).also { apiService = it }
        }
    }

    // Assembles the OkHttp client (auth + logging) and the Retrofit/Gson instance.
    private fun build(context: Context): ApiService {
        val sessionManager = SessionManager(context.applicationContext)

        val logging = HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC }

        val client = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(sessionManager))
            .addInterceptor(logging)
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl(Constants.API_BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        return retrofit.create(ApiService::class.java)
    }
}
