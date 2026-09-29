// -----------------------------------------------------------------------------
// File: OperatorHomeActivity.kt
// Purpose: Grid Operator mobile dashboard — pending/approved-future counts
//          and the pending-reservation queue (tap a row to approve it),
//          plus the entry point into QR scanning mode.
// Module owner: Member D (Grid Operator Ops & Service Integration)
// -----------------------------------------------------------------------------
package com.solarmicrogrid.app.operator

import android.app.AlertDialog
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.solarmicrogrid.app.auth.LoginActivity
import com.solarmicrogrid.app.data.local.SessionManager
import com.solarmicrogrid.app.data.remote.RetrofitClient
import com.solarmicrogrid.app.databinding.ActivityOperatorHomeBinding
import com.solarmicrogrid.app.prosumer.ReservationAdapter
import com.solarmicrogrid.app.util.applyEdgeToEdgeInsets
import com.solarmicrogrid.app.util.errorMessageOrDefault
import kotlinx.coroutines.launch

class OperatorHomeActivity : AppCompatActivity() {

    private lateinit var binding: ActivityOperatorHomeBinding
    private lateinit var sessionManager: SessionManager
    private lateinit var adapter: ReservationAdapter

    // Sets up the dashboard, its pending-reservations list and the scan/logout actions.
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityOperatorHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)
        applyEdgeToEdgeInsets(topInsetView = binding.heroSection)
        sessionManager = SessionManager(this)

        val session = sessionManager.current() ?: return redirectToLogin()
        binding.textWelcome.text = session.fullName

        adapter = ReservationAdapter(emptyList()) { reservation -> confirmApprove(reservation.id, reservation.reservationCode) }
        binding.recyclerPending.layoutManager = LinearLayoutManager(this)
        binding.recyclerPending.adapter = adapter
        binding.recyclerPending.isNestedScrollingEnabled = false

        binding.swipeRefresh.setColorSchemeResources(com.solarmicrogrid.app.R.color.brand_600)
        binding.swipeRefresh.setOnRefreshListener { loadDashboard() }
        binding.buttonScan.setOnClickListener { startActivity(Intent(this, ScanActivity::class.java)) }
        binding.buttonLogout.setOnClickListener { logout() }
    }

    // Refreshes the dashboard every time this screen regains focus.
    override fun onResume() {
        super.onResume()
        loadDashboard()
    }

    // Fetches the operator dashboard summary from the API.
    private fun loadDashboard() {
        binding.swipeRefresh.isRefreshing = true
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.getApiService(this@OperatorHomeActivity).getOperatorDashboard()
                if (response.isSuccessful && response.body() != null) {
                    val dashboard = response.body()!!
                    binding.textPendingCount.text = dashboard.pendingReservationsCount.toString()
                    binding.textApprovedCount.text = dashboard.approvedFutureReservationsCount.toString()
                    adapter.submitList(dashboard.pendingReservations)
                    binding.emptyState.visibility =
                        if (dashboard.pendingReservations.isEmpty()) android.view.View.VISIBLE else android.view.View.GONE
                }
            } catch (e: Exception) {
                Toast.makeText(this@OperatorHomeActivity, "Could not reach the server. Check your connection.", Toast.LENGTH_SHORT).show()
            } finally {
                binding.swipeRefresh.isRefreshing = false
            }
        }
    }

    // Confirms and submits approval for a pending reservation (issues its QR token).
    private fun confirmApprove(reservationId: String, code: String) {
        AlertDialog.Builder(this)
            .setTitle("Approve Reservation")
            .setMessage("Approve $code? This issues its transaction QR code to the prosumer.")
            .setPositiveButton("Approve") { _, _ -> submitApprove(reservationId) }
            .setNegativeButton("Cancel", null)
            .show()
    }

    // Calls the approve endpoint and refreshes the dashboard on success.
    private fun submitApprove(reservationId: String) {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.getApiService(this@OperatorHomeActivity).approveReservation(reservationId)
                if (response.isSuccessful) {
                    Toast.makeText(this@OperatorHomeActivity, "Reservation approved.", Toast.LENGTH_SHORT).show()
                    loadDashboard()
                } else {
                    Toast.makeText(this@OperatorHomeActivity, response.errorMessageOrDefault("Approval failed."), Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@OperatorHomeActivity, "Could not reach the server. Check your connection.", Toast.LENGTH_SHORT).show()
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
