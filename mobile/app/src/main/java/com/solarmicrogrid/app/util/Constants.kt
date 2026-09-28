// -----------------------------------------------------------------------------
// File: Constants.kt
// Purpose: App-wide constants — the Web API base URL and shared Intent extra
//          keys. On the emulator, 10.0.2.2 aliases the host machine's
//          localhost. On a physical device over USB, `adb reverse tcp:5080
//          tcp:5080` forwards the device's own localhost to the host, so
//          127.0.0.1 works there too without needing a shared Wi-Fi network.
// Module owner: shared infrastructure
// -----------------------------------------------------------------------------
package com.solarmicrogrid.app.util

object Constants {
    // Points at the ASP.NET Core Web API. Swap for the IIS-hosted URL when deploying.
    const val API_BASE_URL = "http://127.0.0.1:5080/api/"

    // Same host without the "api/" suffix, for loading static assets like uploaded photos.
    const val SERVER_BASE_URL = "http://127.0.0.1:5080/"

    const val EXTRA_RESERVATION_ID = "extra_reservation_id"
    const val EXTRA_STATION_ID = "extra_station_id"
    const val EXTRA_QR_TOKEN = "extra_qr_token"
}
