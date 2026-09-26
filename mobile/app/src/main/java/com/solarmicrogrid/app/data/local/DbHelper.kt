// -----------------------------------------------------------------------------
// File: DbHelper.kt
// Purpose: SQLiteOpenHelper defining the local database schema — a
//          single-row session table (JWT + logged-in profile) and a
//          station cache table for offline browsing of the map screen.
//          This is local persistence only; MongoDB via the API remains
//          the single source of truth for every business record.
// Module owner: Member D (Service Integration, Local Persistence)
// -----------------------------------------------------------------------------
package com.solarmicrogrid.app.data.local

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class DbHelper(context: Context) : SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    companion object {
        private const val DATABASE_NAME = "solar_microgrid_local.db"
        private const val DATABASE_VERSION = 1

        const val TABLE_SESSION = "session"
        const val COL_TOKEN = "token"
        const val COL_USER_ID = "user_id"
        const val COL_USER_TYPE = "user_type"
        const val COL_FULL_NAME = "full_name"
        const val COL_NIC = "nic"

        const val TABLE_STATION_CACHE = "station_cache"
        const val COL_STATION_ID = "id"
        const val COL_STATION_NAME = "station_name"
        const val COL_LAT = "lat"
        const val COL_LNG = "lng"
        const val COL_AVAILABLE_SLOTS = "available_slots"
        const val COL_TOTAL_SLOTS = "total_slots"
    }

    // Creates the session and station-cache tables on first run.
    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE $TABLE_SESSION (
                $COL_TOKEN TEXT PRIMARY KEY,
                $COL_USER_ID TEXT NOT NULL,
                $COL_USER_TYPE TEXT NOT NULL,
                $COL_FULL_NAME TEXT NOT NULL,
                $COL_NIC TEXT
            )
            """.trimIndent()
        )
        db.execSQL(
            """
            CREATE TABLE $TABLE_STATION_CACHE (
                $COL_STATION_ID TEXT PRIMARY KEY,
                $COL_STATION_NAME TEXT NOT NULL,
                $COL_LAT REAL NOT NULL,
                $COL_LNG REAL NOT NULL,
                $COL_AVAILABLE_SLOTS INTEGER NOT NULL,
                $COL_TOTAL_SLOTS INTEGER NOT NULL
            )
            """.trimIndent()
        )
    }

    // Drops and recreates both tables on a schema version bump.
    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS $TABLE_SESSION")
        db.execSQL("DROP TABLE IF EXISTS $TABLE_STATION_CACHE")
        onCreate(db)
    }
}
