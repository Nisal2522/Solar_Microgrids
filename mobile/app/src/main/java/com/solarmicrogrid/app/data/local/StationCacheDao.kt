// -----------------------------------------------------------------------------
// File: StationCacheDao.kt
// Purpose: Caches the last-fetched nearby-station list in SQLite so the map
//          screen has something to show immediately (and offline) before
//          the live API response arrives.
// Module owner: Member B (Microgrid Nodes & Maps)
// -----------------------------------------------------------------------------
package com.solarmicrogrid.app.data.local

import android.content.ContentValues
import android.content.Context
import com.solarmicrogrid.app.data.model.StationResponse

data class CachedStation(
    val id: String,
    val stationName: String,
    val lat: Double,
    val lng: Double,
    val availableSlots: Int,
    val totalSlots: Int
)

class StationCacheDao(context: Context) {

    private val dbHelper = DbHelper(context.applicationContext)

    // Replaces the cached station list with the latest data fetched from the API.
    fun replaceAll(stations: List<StationResponse>) {
        val db = dbHelper.writableDatabase
        db.beginTransaction()
        try {
            db.delete(DbHelper.TABLE_STATION_CACHE, null, null)
            stations.forEach { station ->
                val values = ContentValues().apply {
                    put(DbHelper.COL_STATION_ID, station.id)
                    put(DbHelper.COL_STATION_NAME, station.stationName)
                    put(DbHelper.COL_LAT, station.lat)
                    put(DbHelper.COL_LNG, station.lng)
                    put(DbHelper.COL_AVAILABLE_SLOTS, station.availableBatterySlots)
                    put(DbHelper.COL_TOTAL_SLOTS, station.totalBatterySlots)
                }
                db.insert(DbHelper.TABLE_STATION_CACHE, null, values)
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }

    // Reads whatever was last cached, for offline/instant display.
    fun getAll(): List<CachedStation> {
        val db = dbHelper.readableDatabase
        val result = mutableListOf<CachedStation>()
        db.query(DbHelper.TABLE_STATION_CACHE, null, null, null, null, null, null).use { cursor ->
            while (cursor.moveToNext()) {
                result.add(
                    CachedStation(
                        id = cursor.getString(cursor.getColumnIndexOrThrow(DbHelper.COL_STATION_ID)),
                        stationName = cursor.getString(cursor.getColumnIndexOrThrow(DbHelper.COL_STATION_NAME)),
                        lat = cursor.getDouble(cursor.getColumnIndexOrThrow(DbHelper.COL_LAT)),
                        lng = cursor.getDouble(cursor.getColumnIndexOrThrow(DbHelper.COL_LNG)),
                        availableSlots = cursor.getInt(cursor.getColumnIndexOrThrow(DbHelper.COL_AVAILABLE_SLOTS)),
                        totalSlots = cursor.getInt(cursor.getColumnIndexOrThrow(DbHelper.COL_TOTAL_SLOTS))
                    )
                )
            }
        }
        return result
    }
}
