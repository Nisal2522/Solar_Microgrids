// -----------------------------------------------------------------------------
// File: MapActivity.kt
// Purpose: Plots nearby microgrid stations on Google Maps around the
//          device's current location, with a station-info marker popup.
//          Falls back to the SQLite station cache (StationCacheDao) so the
//          screen still shows something when the API call is slow/offline.
// Module owner: Member B (Microgrid Nodes & Maps)
// -----------------------------------------------------------------------------
package com.solarmicrogrid.app.prosumer

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.ViewGroup
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.MarkerOptions
import com.google.android.gms.location.LocationServices
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.solarmicrogrid.app.R
import com.solarmicrogrid.app.data.local.StationCacheDao
import com.solarmicrogrid.app.data.remote.RetrofitClient
import kotlinx.coroutines.launch

class MapActivity : AppCompatActivity(), OnMapReadyCallback {

    private lateinit var googleMap: GoogleMap
    private lateinit var stationCacheDao: StationCacheDao
    private val locationPermissionCode = 1001

    // Sets up the map fragment and local cache.
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_map)
        stationCacheDao = StationCacheDao(this)

        val mapFragment = supportFragmentManager.findFragmentById(R.id.mapFragment) as SupportMapFragment
        mapFragment.getMapAsync(this)

        setupBottomNav()
        setupEdgeToEdge()
    }

    // Pushes the floating header card below the status bar (by margin, since it
    // floats rather than sitting flush) and the bottom nav above the gesture bar.
    private fun setupEdgeToEdge() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val headerCard = findViewById<ViewGroup>(R.id.headerCard)
        val bottomNav = findViewById<BottomNavigationView>(R.id.bottomNav)
        val baseTopMargin = (headerCard.layoutParams as ViewGroup.MarginLayoutParams).topMargin
        ViewCompat.setOnApplyWindowInsetsListener(headerCard.rootView) { _, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            (headerCard.layoutParams as ViewGroup.MarginLayoutParams).topMargin = baseTopMargin + bars.top
            headerCard.requestLayout()
            bottomNav.setPadding(bottomNav.paddingLeft, bottomNav.paddingTop, bottomNav.paddingRight, bars.bottom)
            insets
        }
    }

    // Wires the shared bottom tab bar, highlighting this screen's own tab.
    private fun setupBottomNav() {
        val bottomNav = findViewById<BottomNavigationView>(R.id.bottomNav)
        bottomNav.selectedItemId = R.id.nav_map
        bottomNav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_home -> { startActivity(Intent(this, ProsumerHomeActivity::class.java)); false }
                R.id.nav_history -> { startActivity(Intent(this, HistoryActivity::class.java)); false }
                R.id.nav_profile -> { startActivity(Intent(this, ProfileActivity::class.java)); false }
                else -> true
            }
        }
    }

    // Called once the map is ready to receive markers/camera moves.
    override fun onMapReady(map: GoogleMap) {
        googleMap = map

        // Show whatever was cached last, immediately.
        stationCacheDao.getAll().forEach { station ->
            googleMap.addMarker(
                MarkerOptions().position(LatLng(station.lat, station.lng))
                    .title(station.stationName)
                    .snippet("${station.availableSlots}/${station.totalSlots} battery slots available")
            )
        }

        if (hasLocationPermission()) {
            loadNearbyStations()
        } else {
            ActivityCompat.requestPermissions(
                this, arrayOf(Manifest.permission.ACCESS_FINE_LOCATION), locationPermissionCode
            )
        }
    }

    // Checks whether fine-location permission has already been granted.
    private fun hasLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
    }

    // Reacts to the location permission prompt's result.
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == locationPermissionCode && grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            loadNearbyStations()
        }
    }

    // Gets the last-known location, then queries the API for nearby stations around it.
    @android.annotation.SuppressLint("MissingPermission")
    private fun loadNearbyStations() {
        val fusedClient = LocationServices.getFusedLocationProviderClient(this)
        fusedClient.lastLocation.addOnSuccessListener { location ->
            val lat = location?.latitude ?: 6.9271 // Falls back to Colombo if location is unavailable.
            val lng = location?.longitude ?: 79.8612

            googleMap.moveCamera(CameraUpdateFactory.newLatLngZoom(LatLng(lat, lng), 11f))

            lifecycleScope.launch {
                try {
                    val response = RetrofitClient.getApiService(this@MapActivity).getNearbyStations(lat, lng, 50.0)
                    if (response.isSuccessful && response.body() != null) {
                        val stations = response.body()!!
                        stationCacheDao.replaceAll(stations)
                        googleMap.clear()
                        stations.forEach { station ->
                            googleMap.addMarker(
                                MarkerOptions().position(LatLng(station.lat, station.lng))
                                    .title(station.stationName)
                                    .snippet("${station.availableBatterySlots}/${station.totalBatterySlots} battery slots available")
                            )
                        }
                    }
                } catch (e: Exception) {
                    // Keep whatever markers are already on screen (loaded from the cache above).
                }
            }
        }
    }
}
