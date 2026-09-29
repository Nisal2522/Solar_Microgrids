// -----------------------------------------------------------------------------
// File: SessionManager.kt
// Purpose: Reads/writes the single logged-in session row in SQLite, so the
//          JWT and profile survive an app restart without re-authenticating
//          against the API every launch.
// Module owner: Member D (Service Integration, Local Persistence)
// -----------------------------------------------------------------------------
package com.solarmicrogrid.app.data.local

import android.content.ContentValues
import android.content.Context
import com.solarmicrogrid.app.data.model.LoginResponse

data class Session(
    val token: String,
    val userId: String,
    val userType: String,
    val fullName: String,
    val nic: String?
)

class SessionManager(context: Context) {

    private val dbHelper = DbHelper(context.applicationContext)

    // Persists the freshly-issued login response as the (single) active session.
    fun save(login: LoginResponse) {
        val db = dbHelper.writableDatabase
        db.delete(DbHelper.TABLE_SESSION, null, null)
        val values = ContentValues().apply {
            put(DbHelper.COL_TOKEN, login.token)
            put(DbHelper.COL_USER_ID, login.userId)
            put(DbHelper.COL_USER_TYPE, login.userType)
            put(DbHelper.COL_FULL_NAME, login.fullName)
            put(DbHelper.COL_NIC, login.nic)
        }
        db.insert(DbHelper.TABLE_SESSION, null, values)
    }

    // Reads the currently saved session, or null if nobody is logged in.
    fun current(): Session? {
        val db = dbHelper.readableDatabase
        db.query(DbHelper.TABLE_SESSION, null, null, null, null, null, null).use { cursor ->
            if (!cursor.moveToFirst()) return null
            return Session(
                token = cursor.getString(cursor.getColumnIndexOrThrow(DbHelper.COL_TOKEN)),
                userId = cursor.getString(cursor.getColumnIndexOrThrow(DbHelper.COL_USER_ID)),
                userType = cursor.getString(cursor.getColumnIndexOrThrow(DbHelper.COL_USER_TYPE)),
                fullName = cursor.getString(cursor.getColumnIndexOrThrow(DbHelper.COL_FULL_NAME)),
                nic = cursor.getString(cursor.getColumnIndexOrThrow(DbHelper.COL_NIC))
            )
        }
    }

    // Clears the session row on logout.
    fun clear() {
        dbHelper.writableDatabase.delete(DbHelper.TABLE_SESSION, null, null)
    }
}
