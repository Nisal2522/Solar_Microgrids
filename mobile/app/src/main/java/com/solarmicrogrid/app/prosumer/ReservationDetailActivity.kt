package com.solarmicrogrid.app.prosumer

import android.app.AlertDialog
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.solarmicrogrid.app.data.model.CancelReservationRequest
import com.solarmicrogrid.app.data.model.ReservationResponse
import com.solarmicrogrid.app.data.remote.RetrofitClient
import com.solarmicrogrid.app.databinding.ActivityReservationDetailBinding
import com.solarmicrogrid.app.util.Constants
import com.solarmicrogrid.app.util.QrCodeGenerator
import com.solarmicrogrid.app.util.applyEdgeToEdgeInsets
import com.solarmicrogrid.app.util.errorMessageOrDefault
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

class ReservationDetailActivity : AppCompatActivity() {

    private lateinit var binding: ActivityReservationDetailBinding
    private lateinit var reservationId: String

    // Loads the reservation and wires the Modify/Cancel actions.
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityReservationDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)
        applyEdgeToEdgeInsets(topInsetView = binding.heroSection)

        reservationId = intent.getStringExtra(Constants.EXTRA_RESERVATION_ID) ?: return finish()

        binding.buttonEdit.setOnClickListener {
            val intent = Intent(this, ReservationFormActivity::class.java)
            intent.putExtra(Constants.EXTRA_RESERVATION_ID, reservationId)
            startActivity(intent)
        }
        binding.buttonCancel.setOnClickListener { promptCancel() }

        loadReservation()
    }

    // Reloads the reservation whenever this screen regains focus (e.g. after an edit).
    override fun onResume() {
        super.onResume()
        loadReservation()
    }

    // Fetches the current reservation state from the API and renders it.
    private fun loadReservation() {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.getApiService(this@ReservationDetailActivity).getReservation(reservationId)
                if (response.isSuccessful && response.body() != null) {
                    render(response.body()!!)
                }
            } catch (e: Exception) {
                showError("Could not load reservation.")
            }
        }
    }

    // Populates the screen with the reservation's fields and QR code (if approved).
    private fun render(reservation: ReservationResponse) {
        binding.textCode.text = reservation.reservationCode
        binding.textStatus.text = reservation.status.uppercase()
        binding.textScheduled.text = formatSchedule(reservation.scheduledDateTime)
        binding.textEnergy.text = "${reservation.energyAmountKWh} kWh"

        val canModify = reservation.status == "Pending" || reservation.status == "Approved"
        binding.buttonEdit.visibility = if (canModify) View.VISIBLE else View.GONE
        binding.buttonCancel.visibility = if (canModify) View.VISIBLE else View.GONE

        if (reservation.status == "Approved" && !reservation.qrToken.isNullOrEmpty()) {
            binding.imageQr.setImageBitmap(QrCodeGenerator.generate(reservation.qrToken))
            binding.qrCard.visibility = View.VISIBLE
        } else {
            binding.qrCard.visibility = View.GONE
        }
    }

    // Turns the API's ISO timestamp into a readable local date and time.
    private fun formatSchedule(iso: String): String {
        return try {
            val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }
            val parsed = parser.parse(iso.take(19)) ?: return iso.take(16).replace("T", " ")
            SimpleDateFormat("dd MMM yyyy 'at' HH:mm", Locale.US).format(parsed)
        } catch (e: Exception) {
            iso.take(16).replace("T", " ")
        }
    }

    // Prompts for a cancellation reason, then submits it to the API.
    private fun promptCancel() {
        val input = EditText(this)
        input.hint = "Reason for cancellation"
        AlertDialog.Builder(this)
            .setTitle("Cancel Reservation")
            .setView(input)
            .setPositiveButton("Cancel Reservation") { _, _ -> submitCancel(input.text.toString()) }
            .setNegativeButton("Keep Reservation", null)
            .show()
    }

    // Sends the cancellation request; the API rejects it if under 12 hours' notice remains.
    private fun submitCancel(reason: String) {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.getApiService(this@ReservationDetailActivity)
                    .cancelReservation(reservationId, CancelReservationRequest(reason))
                if (response.isSuccessful) {
                    Toast.makeText(this@ReservationDetailActivity, "Reservation cancelled.", Toast.LENGTH_SHORT).show()
                    finish()
                } else {
                    showError(response.errorMessageOrDefault("Could not cancel this reservation."))
                }
            } catch (e: Exception) {
                showError("Could not reach the server. Check your connection.")
            }
        }
    }

    // Shows the inline error banner.
    private fun showError(message: String) {
        binding.textError.text = message
        binding.errorBanner.visibility = View.VISIBLE
    }
}
