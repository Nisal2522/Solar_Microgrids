// -----------------------------------------------------------------------------
// File: TransferConfirmActivity.kt
// Purpose: Shows the QR-verified reservation's details and finalises the
//          energy transfer business logic (marks it Completed server-side)
//          once the Grid Operator confirms.
// Module owner: Member D (Grid Operator Verification)
// -----------------------------------------------------------------------------
package com.solarmicrogrid.app.operator

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.solarmicrogrid.app.data.remote.RetrofitClient
import com.solarmicrogrid.app.databinding.ActivityTransferConfirmBinding
import com.solarmicrogrid.app.util.Constants
import com.solarmicrogrid.app.util.applyEdgeToEdgeInsets
import com.solarmicrogrid.app.util.errorMessageOrDefault
import kotlinx.coroutines.launch

class TransferConfirmActivity : AppCompatActivity() {

    private lateinit var binding: ActivityTransferConfirmBinding
    private lateinit var reservationId: String

    // Loads the verified reservation's details and wires the Complete action.
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityTransferConfirmBinding.inflate(layoutInflater)
        setContentView(binding.root)
        applyEdgeToEdgeInsets(topInsetView = binding.heroSection)

        reservationId = intent.getStringExtra(Constants.EXTRA_RESERVATION_ID) ?: return finish()
        binding.buttonComplete.setOnClickListener { completeTransfer() }

        loadReservation()
    }

    // Fetches the reservation's current details for display.
    private fun loadReservation() {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.getApiService(this@TransferConfirmActivity).getReservation(reservationId)
                if (response.isSuccessful && response.body() != null) {
                    val reservation = response.body()!!
                    binding.textCode.text = reservation.reservationCode
                    binding.textDetails.text =
                        "Prosumer NIC: ${reservation.prosumerNic}\nScheduled: ${reservation.scheduledDateTime.replace("T", " ").take(16)}\nEnergy: ${reservation.energyAmountKWh} kWh"
                }
            } catch (e: Exception) {
                binding.textError.text = "Could not reach the server. Check your connection."
                binding.errorBanner.visibility = View.VISIBLE
            }
        }
    }

    // Marks the reservation Completed on the server, finalising the transfer.
    private fun completeTransfer() {
        binding.buttonComplete.isEnabled = false
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.getApiService(this@TransferConfirmActivity).completeReservation(reservationId)
                if (response.isSuccessful) {
                    Toast.makeText(this@TransferConfirmActivity, "Energy transfer completed.", Toast.LENGTH_LONG).show()
                    finish()
                } else {
                    binding.textError.text = response.errorMessageOrDefault("Failed to complete transfer.")
                    binding.errorBanner.visibility = View.VISIBLE
                    binding.buttonComplete.isEnabled = true
                }
            } catch (e: Exception) {
                binding.textError.text = "Could not reach the server. Check your connection."
                binding.errorBanner.visibility = View.VISIBLE
                binding.buttonComplete.isEnabled = true
            }
        }
    }
}
