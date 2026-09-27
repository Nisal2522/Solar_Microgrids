// -----------------------------------------------------------------------------
// File: ReservationAdapter.kt
// Purpose: RecyclerView adapter shared by the prosumer dashboard/history and the
//          grid operator's approval queue. Renders one reservation card per row
//          and colours the status pill to match the web console's palette.
// Module owner: Member C (Booking Views & Operational Dashboards)
// -----------------------------------------------------------------------------
package com.solarmicrogrid.app.prosumer

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.solarmicrogrid.app.R
import com.solarmicrogrid.app.data.model.ReservationResponse
import com.solarmicrogrid.app.databinding.ItemReservationBinding
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

class ReservationAdapter(
    private var items: List<ReservationResponse>,
    private val onClick: (ReservationResponse) -> Unit
) : RecyclerView.Adapter<ReservationAdapter.ReservationViewHolder>() {

    class ReservationViewHolder(val binding: ItemReservationBinding) : RecyclerView.ViewHolder(binding.root)

    // Inflates a single reservation card.
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ReservationViewHolder {
        val binding = ItemReservationBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ReservationViewHolder(binding)
    }

    // Binds one reservation's fields and applies its status colours.
    override fun onBindViewHolder(holder: ReservationViewHolder, position: Int) {
        val reservation = items[position]
        val context = holder.itemView.context

        holder.binding.textCode.text = reservation.reservationCode
        holder.binding.textSchedule.text = formatSchedule(reservation.scheduledDateTime)
        holder.binding.textEnergy.text = "${reservation.energyAmountKWh} kWh"

        val (pillBackground, pillText) = statusColours(reservation.status)
        holder.binding.textStatus.text = reservation.status
        holder.binding.textStatus.setBackgroundResource(pillBackground)
        holder.binding.textStatus.setTextColor(ContextCompat.getColor(context, pillText))

        holder.itemView.setOnClickListener { onClick(reservation) }
    }

    override fun getItemCount(): Int = items.size

    // Replaces the backing list and refreshes the view.
    fun submitList(newItems: List<ReservationResponse>) {
        items = newItems
        notifyDataSetChanged()
    }

    // Maps a reservation status onto its pill background and text colour.
    private fun statusColours(status: String): Pair<Int, Int> = when (status) {
        "Approved" -> R.drawable.bg_pill_emerald to R.color.brand_700
        "Pending" -> R.drawable.bg_pill_amber to R.color.solar_600
        "Completed" -> R.drawable.bg_pill_sky to R.color.sky_700
        "Cancelled" -> R.drawable.bg_pill_rose to R.color.rose_700
        else -> R.drawable.bg_pill_slate to R.color.slate_600
    }

    // Turns the API's ISO timestamp into a short, readable local date/time.
    private fun formatSchedule(iso: String): String {
        return try {
            val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }
            val parsed = parser.parse(iso.take(19)) ?: return iso.take(16).replace("T", " ")
            SimpleDateFormat("dd MMM yyyy · HH:mm", Locale.US).format(parsed)
        } catch (e: Exception) {
            iso.take(16).replace("T", " ")
        }
    }
}
