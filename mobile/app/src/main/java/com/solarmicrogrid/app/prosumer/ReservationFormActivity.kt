package com.solarmicrogrid.app.prosumer

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.os.Bundle
import android.view.View
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.solarmicrogrid.app.data.local.SessionManager
import com.solarmicrogrid.app.data.model.CreateReservationRequest
import com.solarmicrogrid.app.data.model.SlotResponse
import com.solarmicrogrid.app.data.model.StationResponse
import com.solarmicrogrid.app.data.model.UpdateReservationRequest
import com.solarmicrogrid.app.data.remote.RetrofitClient
import com.solarmicrogrid.app.databinding.ActivityReservationFormBinding
import com.solarmicrogrid.app.util.Constants
import com.solarmicrogrid.app.util.applyEdgeToEdgeInsets
import com.solarmicrogrid.app.util.errorMessageOrDefault
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

class ReservationFormActivity : AppCompatActivity() {

    private lateinit var binding: ActivityReservationFormBinding
    private lateinit var sessionManager: SessionManager

    private var stations: List<StationResponse> = emptyList()
    private var slots: List<SlotResponse> = emptyList()
    private var selectedCalendar: Calendar? = null
    private var editingReservationId: String? = null

    private val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }

    // Loads stations (and the reservation being edited, if any) and wires the form.
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityReservationFormBinding.inflate(layoutInflater)
        setContentView(binding.root)
        applyEdgeToEdgeInsets(topInsetView = binding.heroSection)
        sessionManager = SessionManager(this)

        editingReservationId = intent.getStringExtra(Constants.EXTRA_RESERVATION_ID)
        if (editingReservationId != null) {
            binding.textTitle.text = "Edit Reservation"
        }

        binding.buttonPickDateTime.setOnClickListener { showDateTimePicker() }
        binding.buttonSubmit.setOnClickListener { submit() }

        loadStations()
    }

    // Fetches the active station list for the dropdown.
    private fun loadStations() {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.getApiService(this@ReservationFormActivity).getStations()
                if (response.isSuccessful && response.body() != null) {
                    stations = response.body()!!.filter { it.status == "Active" }
                    binding.spinnerStation.adapter = ArrayAdapter(
                        this@ReservationFormActivity, android.R.layout.simple_spinner_dropdown_item,
                        stations.map { it.stationName }
                    )
                    binding.spinnerStation.setOnItemSelectedListener(object : android.widget.AdapterView.OnItemSelectedListener {
                        override fun onItemSelected(parent: android.widget.AdapterView<*>?, view: View?, position: Int, id: Long) {
                            loadSlots(stations[position].id)
                        }
                        override fun onNothingSelected(parent: android.widget.AdapterView<*>?) {}
                    })
                }
            } catch (e: Exception) {
                showError("Could not load stations.")
            }
        }
    }

    // Fetches the bookable slots for the chosen station.
    private fun loadSlots(stationId: String) {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.getApiService(this@ReservationFormActivity).getSlots(stationId)
                if (response.isSuccessful && response.body() != null) {
                    slots = response.body()!!.filter { it.status != "Closed" }
                    binding.spinnerSlot.adapter = ArrayAdapter(
                        this@ReservationFormActivity, android.R.layout.simple_spinner_dropdown_item,
                        slots.map { "${it.date.take(10)} ${it.startTime}-${it.endTime} (${it.capacityAvailable} left)" }
                    )
                }
            } catch (e: Exception) {
                showError("Could not load slots.")
            }
        }
    }

    // Opens a date picker followed by a time picker, storing the combined UTC instant.
    private fun showDateTimePicker() {
        val now = Calendar.getInstance()
        DatePickerDialog(this, { _, year, month, day ->
            TimePickerDialog(this, { _, hour, minute ->
                val calendar = Calendar.getInstance()
                calendar.set(year, month, day, hour, minute, 0)
                selectedCalendar = calendar
                binding.buttonPickDateTime.text = SimpleDateFormat("dd MMM yyyy, HH:mm", Locale.US).format(calendar.time)
            }, now.get(Calendar.HOUR_OF_DAY), now.get(Calendar.MINUTE), true).show()
        }, now.get(Calendar.YEAR), now.get(Calendar.MONTH), now.get(Calendar.DAY_OF_MONTH)).show()
    }

    // Validates the form and creates or updates the reservation via the API.
    private fun submit() {
        val nic = sessionManager.current()?.nic ?: return
        if (stations.isEmpty() || slots.isEmpty() || selectedCalendar == null) {
            showError("Please select a station, slot and date/time.")
            return
        }
        val energyText = binding.inputEnergyAmount.text.toString()
        val energyAmount = energyText.toDoubleOrNull()
        if (energyAmount == null || energyAmount <= 0) {
            showError("Enter a valid energy amount.")
            return
        }

        val station = stations[binding.spinnerStation.selectedItemPosition]
        val slot = slots[binding.spinnerSlot.selectedItemPosition]
        val scheduledIso = isoFormat.format(selectedCalendar!!.time)

        binding.buttonSubmit.isEnabled = false
        lifecycleScope.launch {
            try {
                val response = if (editingReservationId == null) {
                    RetrofitClient.getApiService(this@ReservationFormActivity).createReservation(
                        CreateReservationRequest(nic, station.id, slot.id, scheduledIso, energyAmount)
                    )
                } else {
                    RetrofitClient.getApiService(this@ReservationFormActivity).updateReservation(
                        editingReservationId!!, UpdateReservationRequest(slot.id, scheduledIso, energyAmount)
                    )
                }

                if (response.isSuccessful) {
                    Toast.makeText(this@ReservationFormActivity, "Reservation saved.", Toast.LENGTH_SHORT).show()
                    finish()
                } else {
                    showError(response.errorMessageOrDefault("Failed to save reservation."))
                }
            } catch (e: Exception) {
                showError("Could not reach the server. Check your connection.")
            } finally {
                binding.buttonSubmit.isEnabled = true
            }
        }
    }

    // Shows the inline error banner above the form.
    private fun showError(message: String) {
        binding.textError.text = message
        binding.errorBanner.visibility = View.VISIBLE
    }
}
