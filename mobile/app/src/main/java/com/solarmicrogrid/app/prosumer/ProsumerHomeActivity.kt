// -----------------------------------------------------------------------------
// File: ProsumerHomeActivity.kt
// Purpose: Prosumer dashboard — approved/pending reservation counts and the
//          upcoming-bookings list read live from the API, plus bottom
//          navigation to the map, history and profile screens.
// Module owner: Member C (Booking Views & Operational Dashboards)
// -----------------------------------------------------------------------------
package com.solarmicrogrid.app.prosumer

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.bumptech.glide.Glide
import com.bumptech.glide.load.resource.bitmap.CenterCrop
import com.bumptech.glide.load.resource.bitmap.RoundedCorners
import com.solarmicrogrid.app.R
import com.solarmicrogrid.app.auth.LoginActivity
import com.solarmicrogrid.app.data.local.SessionManager
import com.solarmicrogrid.app.data.remote.RetrofitClient
import com.solarmicrogrid.app.databinding.ActivityProsumerHomeBinding
import com.solarmicrogrid.app.util.Constants
import com.solarmicrogrid.app.util.applyEdgeToEdgeInsets
import kotlinx.coroutines.launch

class ProsumerHomeActivity : AppCompatActivity() {

    private lateinit var binding: ActivityProsumerHomeBinding
    private lateinit var sessionManager: SessionManager
    private lateinit var adapter: ReservationAdapter

    // Sets up the dashboard, its list adapter and the bottom navigation.
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProsumerHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)
        applyEdgeToEdgeInsets(topInsetView = binding.heroSection, bottomInsetView = binding.bottomNav)
        sessionManager = SessionManager(this)

        val session = sessionManager.current() ?: return redirectToLogin()
        binding.textWelcome.text = session.fullName
        binding.textAvatar.text = initials(session.fullName)

        adapter = ReservationAdapter(emptyList()) { reservation ->
            val intent = Intent(this, ReservationDetailActivity::class.java)
            intent.putExtra(Constants.EXTRA_RESERVATION_ID, reservation.id)
            startActivity(intent)
        }
        binding.recyclerUpcoming.layoutManager = LinearLayoutManager(this)
        binding.recyclerUpcoming.adapter = adapter
        binding.recyclerUpcoming.isNestedScrollingEnabled = false

        binding.swipeRefresh.setColorSchemeResources(R.color.brand_600)
        binding.swipeRefresh.setOnRefreshListener { session.nic?.let { loadDashboard(it) } }
        binding.buttonNewReservation.setOnClickListener {
            startActivity(Intent(this, ReservationFormActivity::class.java))
        }
        binding.textSeeAll.setOnClickListener { startActivity(Intent(this, HistoryActivity::class.java)) }
        binding.buttonLogout.setOnClickListener { logout() }

        binding.bottomNav.selectedItemId = R.id.nav_home
        binding.bottomNav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_map -> { startActivity(Intent(this, MapActivity::class.java)); false }
                R.id.nav_history -> { startActivity(Intent(this, HistoryActivity::class.java)); false }
                R.id.nav_profile -> { startActivity(Intent(this, ProfileActivity::class.java)); false }
                else -> true
            }
        }
    }

    // Refreshes the dashboard every time the screen becomes visible again.
    override fun onResume() {
        super.onResume()
        binding.bottomNav.selectedItemId = R.id.nav_home
        sessionManager.current()?.nic?.let {
            loadDashboard(it)
            loadAvatar(it)
        }
    }

    // Fetches the prosumer's dashboard summary from the API.
    private fun loadDashboard(nic: String) {
        binding.swipeRefresh.isRefreshing = true
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.getApiService(this@ProsumerHomeActivity).getProsumerDashboard(nic)
                if (response.isSuccessful && response.body() != null) {
                    val dashboard = response.body()!!
                    binding.textActiveCount.text = dashboard.activeCount.toString()
                    binding.textPendingCount.text = dashboard.pendingCount.toString()
                    adapter.submitList(dashboard.upcomingReservations)
                    binding.emptyState.visibility =
                        if (dashboard.upcomingReservations.isEmpty()) View.VISIBLE else View.GONE
                }
            } catch (e: Exception) {
                Toast.makeText(this@ProsumerHomeActivity, "Could not reach the server. Check your connection.", Toast.LENGTH_SHORT).show()
            } finally {
                binding.swipeRefresh.isRefreshing = false
            }
        }
    }

    // Builds two-letter initials for the avatar chip.
    private fun initials(name: String): String =
        name.split(" ").filter { it.isNotBlank() }.take(2).joinToString("") { it.first().uppercase() }

    // Shows the prosumer's uploaded profile photo in the avatar chip, if one is set.
    private fun loadAvatar(nic: String) {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.getApiService(this@ProsumerHomeActivity).getProsumer(nic)
                val photoUrl = response.body()?.photoUrl
                if (response.isSuccessful && photoUrl != null) {
                    val radiusPx = (10 * resources.displayMetrics.density).toInt()
                    Glide.with(this@ProsumerHomeActivity)
                        .load(Constants.SERVER_BASE_URL.trimEnd('/') + photoUrl)
                        .transform(CenterCrop(), RoundedCorners(radiusPx))
                        .into(binding.imageAvatar)
                    binding.imageAvatar.visibility = View.VISIBLE
                }
            } catch (e: Exception) {
                // Non-critical: the initials chip stays as the fallback.
            }
        }
    }

    // Clears the local session and returns to the login screen.
    private fun logout() {
        sessionManager.clear()
        redirectToLogin()
    }

    // Sends the user back to LoginActivity, clearing the back stack.
    private fun redirectToLogin() {
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
}
