// -----------------------------------------------------------------------------
// File: HistoryActivity.kt
// Purpose: Full booking history for the signed-in prosumer, with a live search
//          box and quick status filter chips over reservation code and status.
// Module owner: Member C (Booking Views & Operational Dashboards)
// -----------------------------------------------------------------------------
package com.solarmicrogrid.app.prosumer

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.solarmicrogrid.app.R
import com.solarmicrogrid.app.data.local.SessionManager
import com.solarmicrogrid.app.data.model.ReservationResponse
import com.solarmicrogrid.app.data.remote.RetrofitClient
import com.solarmicrogrid.app.databinding.ActivityHistoryBinding
import com.solarmicrogrid.app.util.Constants
import com.solarmicrogrid.app.util.applyEdgeToEdgeInsets
import kotlinx.coroutines.launch

class HistoryActivity : AppCompatActivity() {

    private lateinit var binding: ActivityHistoryBinding
    private lateinit var adapter: ReservationAdapter
    private var allReservations: List<ReservationResponse> = emptyList()
    private var statusFilter: String? = null

    // Loads the full reservation history and wires the search box and chips.
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHistoryBinding.inflate(layoutInflater)
        setContentView(binding.root)
        applyEdgeToEdgeInsets(topInsetView = binding.heroSection, bottomInsetView = binding.bottomNav)

        adapter = ReservationAdapter(emptyList()) { reservation ->
            val intent = Intent(this, ReservationDetailActivity::class.java)
            intent.putExtra(Constants.EXTRA_RESERVATION_ID, reservation.id)
            startActivity(intent)
        }
        binding.recyclerHistory.layoutManager = LinearLayoutManager(this)
        binding.recyclerHistory.adapter = adapter

        binding.inputSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) = applyFilter()
            override fun afterTextChanged(s: Editable?) {}
        })

        wireChip(binding.chipAll, null)
        wireChip(binding.chipPending, "Pending")
        wireChip(binding.chipApproved, "Approved")
        wireChip(binding.chipCompleted, "Completed")
        wireChip(binding.chipCancelled, "Cancelled")

        binding.bottomNav.selectedItemId = R.id.nav_history
        binding.bottomNav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_home -> { startActivity(Intent(this, ProsumerHomeActivity::class.java)); false }
                R.id.nav_map -> { startActivity(Intent(this, MapActivity::class.java)); false }
                R.id.nav_profile -> { startActivity(Intent(this, ProfileActivity::class.java)); false }
                else -> true
            }
        }
    }

    // Reloads history whenever the screen regains focus (e.g. after a cancel).
    override fun onResume() {
        super.onResume()
        binding.bottomNav.selectedItemId = R.id.nav_history
        loadHistory()
    }

    // Applies a status chip as the active filter.
    private fun wireChip(chip: TextView, status: String?) {
        chip.setOnClickListener {
            statusFilter = if (statusFilter == status) null else status
            applyFilter()
        }
    }

    // Fetches the prosumer's full booking history from the API.
    private fun loadHistory() {
        val nic = SessionManager(this).current()?.nic ?: return
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.getApiService(this@HistoryActivity).getReservationsByProsumer(nic)
                if (response.isSuccessful && response.body() != null) {
                    allReservations = response.body()!!
                    applyFilter()
                }
            } catch (e: Exception) {
                Toast.makeText(this@HistoryActivity, "Could not reach the server. Check your connection.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    // Filters the in-memory list by the search text and the active status chip.
    private fun applyFilter() {
        val query = binding.inputSearch.text.toString().trim()
        val filtered = allReservations.filter { reservation ->
            val matchesQuery = query.isBlank() ||
                reservation.reservationCode.contains(query, ignoreCase = true) ||
                reservation.status.contains(query, ignoreCase = true)
            val matchesStatus = statusFilter == null || reservation.status == statusFilter
            matchesQuery && matchesStatus
        }

        adapter.submitList(filtered)
        binding.emptyState.visibility = if (filtered.isEmpty()) View.VISIBLE else View.GONE
        binding.recyclerHistory.visibility = if (filtered.isEmpty()) View.GONE else View.VISIBLE
    }
}
