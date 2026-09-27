// -----------------------------------------------------------------------------
// File: StationModels.kt
// Purpose: Response data classes for microgrid nodes (stations) and their
//          bookable energy slots, mirroring the API's StationDtos.cs /
//          SlotDtos.cs.
// Module owner: Member B (Microgrid Nodes & Maps)
// -----------------------------------------------------------------------------
package com.solarmicrogrid.app.data.model

data class ScheduleEntry(
    val day: String,
    val openTime: String,
    val closeTime: String
)

data class StationResponse(
    val id: String,
    val stationName: String,
    val lat: Double,
    val lng: Double,
    val capacityKWh: Double,
    val totalBatterySlots: Int,
    val availableBatterySlots: Int,
    val schedule: List<ScheduleEntry>,
    val status: String
)

data class SlotResponse(
    val id: String,
    val stationId: String,
    val date: String,
    val startTime: String,
    val endTime: String,
    val slotType: String,
    val capacityTotal: Int,
    val capacityAvailable: Int,
    val status: String
)
