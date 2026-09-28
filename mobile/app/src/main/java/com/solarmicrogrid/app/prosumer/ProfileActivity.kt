// -----------------------------------------------------------------------------
// File: ProfileActivity.kt
// Purpose: Prosumer self-service profile — view/edit contact details and
//          request account deactivation (Backoffice-only reactivation
//          afterwards, per the API's business rule).
// Module owner: Member A (Identity & Access)
// -----------------------------------------------------------------------------
package com.solarmicrogrid.app.prosumer

import android.app.AlertDialog
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.bumptech.glide.Glide
import com.bumptech.glide.load.resource.bitmap.CenterCrop
import com.bumptech.glide.load.resource.bitmap.RoundedCorners
import com.solarmicrogrid.app.R
import com.solarmicrogrid.app.auth.LoginActivity
import com.solarmicrogrid.app.data.local.SessionManager
import com.solarmicrogrid.app.data.model.UpdateProsumerRequest
import com.solarmicrogrid.app.data.model.UserResponse
import com.solarmicrogrid.app.data.remote.RetrofitClient
import com.solarmicrogrid.app.databinding.ActivityProfileBinding
import com.solarmicrogrid.app.util.Constants
import com.solarmicrogrid.app.util.applyEdgeToEdgeInsets
import com.solarmicrogrid.app.util.errorMessageOrDefault
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

class ProfileActivity : AppCompatActivity() {

    private lateinit var binding: ActivityProfileBinding
    private lateinit var sessionManager: SessionManager

    // Registered up front (before STARTED) as required by the Activity Result API.
    private val pickImage = registerForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        uri?.let { uploadPhoto(it) }
    }

    // Loads the prosumer's current profile and wires save/deactivate actions.
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)
        applyEdgeToEdgeInsets(topInsetView = binding.heroSection, bottomInsetView = binding.bottomNav)
        sessionManager = SessionManager(this)

        binding.buttonSave.setOnClickListener { saveProfile() }
        binding.buttonDeactivate.setOnClickListener { confirmDeactivate() }
        binding.buttonEditPhoto.setOnClickListener {
            pickImage.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
        }

        binding.bottomNav.selectedItemId = R.id.nav_profile
        binding.bottomNav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_home -> { startActivity(Intent(this, ProsumerHomeActivity::class.java)); false }
                R.id.nav_map -> { startActivity(Intent(this, MapActivity::class.java)); false }
                R.id.nav_history -> { startActivity(Intent(this, HistoryActivity::class.java)); false }
                else -> true
            }
        }

        loadProfile()
    }

    // Fetches the prosumer's profile from the API and fills the form.
    private fun loadProfile() {
        val nic = sessionManager.current()?.nic ?: return
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.getApiService(this@ProfileActivity).getProsumer(nic)
                if (response.isSuccessful && response.body() != null) {
                    val profile = response.body()!!
                    binding.textName.text = profile.fullName
                    binding.textNic.text = "NIC ${profile.nic}"
                    binding.textMemberSince.text = "Member since ${formatMemberSince(profile.createdAt)}"
                    binding.inputFullName.setText(profile.fullName)
                    binding.inputEmail.setText(profile.email)
                    binding.inputPhone.setText(profile.phone)
                    binding.inputAddress.setText(profile.address)
                    renderAvatar(profile)
                    renderStatus(profile.status)
                }
            } catch (e: Exception) {
                showError("Could not reach the server. Check your connection.")
            }
        }
    }

    // Shows the profile photo if one is set, otherwise falls back to initials.
    private fun renderAvatar(profile: UserResponse) {
        binding.textAvatar.text = profile.fullName
            .split(" ").filter { it.isNotBlank() }.take(2)
            .joinToString("") { it.first().uppercase() }

        if (profile.photoUrl != null) {
            val radiusPx = (14 * resources.displayMetrics.density).toInt()
            Glide.with(this)
                .load(Constants.SERVER_BASE_URL.trimEnd('/') + profile.photoUrl)
                .transform(CenterCrop(), RoundedCorners(radiusPx))
                .into(binding.imageAvatar)
            binding.imageAvatar.visibility = View.VISIBLE
        } else {
            binding.imageAvatar.visibility = View.GONE
        }
    }

    // Colours the status pill to match the account's actual state.
    private fun renderStatus(status: String) {
        val (icon, tone, label) = when (status) {
            "Active" -> Triple(R.drawable.ic_check_circle, R.color.brand_300, "Active")
            "PendingActivation" -> Triple(R.drawable.ic_clock, R.color.solar_400, "Pending activation")
            else -> Triple(R.drawable.ic_alert, R.color.rose_500, "Deactivated")
        }
        binding.iconStatus.setImageResource(icon)
        binding.iconStatus.imageTintList = android.content.res.ColorStateList.valueOf(getColor(tone))
        binding.textStatus.text = label
        binding.textStatus.setTextColor(getColor(tone))
    }

    // Turns the API's ISO createdAt timestamp into a "Month yyyy" caption.
    private fun formatMemberSince(iso: String): String {
        return try {
            val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }
            val parsed = parser.parse(iso.take(19)) ?: return iso.take(7)
            SimpleDateFormat("MMMM yyyy", Locale.US).format(parsed)
        } catch (e: Exception) {
            iso.take(7)
        }
    }

    // Uploads the picked gallery image as the prosumer's new profile picture.
    private fun uploadPhoto(uri: Uri) {
        val nic = sessionManager.current()?.nic ?: return
        lifecycleScope.launch {
            try {
                val mimeType = contentResolver.getType(uri) ?: "image/jpeg"
                val extension = when {
                    mimeType.contains("png") -> "png"
                    mimeType.contains("webp") -> "webp"
                    else -> "jpg"
                }
                val bytes = withContext(Dispatchers.IO) {
                    contentResolver.openInputStream(uri)?.use { it.readBytes() }
                } ?: throw IllegalStateException("Could not read the selected image.")

                val requestBody = bytes.toRequestBody(mimeType.toMediaTypeOrNull())
                val part = MultipartBody.Part.createFormData("file", "photo.$extension", requestBody)

                val response = RetrofitClient.getApiService(this@ProfileActivity).uploadProsumerPhoto(nic, part)
                if (response.isSuccessful && response.body() != null) {
                    renderAvatar(response.body()!!)
                    Toast.makeText(this@ProfileActivity, "Profile picture updated.", Toast.LENGTH_SHORT).show()
                } else {
                    showError(response.errorMessageOrDefault("Failed to update profile picture."))
                }
            } catch (e: Exception) {
                showError(e.message ?: "Failed to update profile picture.")
            }
        }
    }

    // Submits the edited profile fields to the API.
    private fun saveProfile() {
        val nic = sessionManager.current()?.nic ?: return
        val request = UpdateProsumerRequest(
            fullName = binding.inputFullName.text.toString().trim(),
            email = binding.inputEmail.text.toString().trim(),
            phone = binding.inputPhone.text.toString().trim(),
            address = binding.inputAddress.text.toString().trim()
        )

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.getApiService(this@ProfileActivity).updateProsumer(nic, request)
                if (response.isSuccessful) {
                    Toast.makeText(this@ProfileActivity, "Profile updated.", Toast.LENGTH_SHORT).show()
                } else {
                    showError(response.errorMessageOrDefault("Failed to update profile."))
                }
            } catch (e: Exception) {
                showError("Could not reach the server. Check your connection.")
            }
        }
    }

    // Confirms and submits an account-deactivation request, then logs the user out.
    private fun confirmDeactivate() {
        AlertDialog.Builder(this)
            .setTitle("Deactivate Account")
            .setMessage("Your account will be deactivated immediately. A Backoffice officer must reactivate it before you can log in again. Continue?")
            .setPositiveButton("Deactivate") { _, _ -> deactivate() }
            .setNegativeButton("Cancel", null)
            .show()
    }

    // Calls the deactivation endpoint and returns to the login screen.
    private fun deactivate() {
        val nic = sessionManager.current()?.nic ?: return
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.getApiService(this@ProfileActivity).requestDeactivation(nic)
                if (response.isSuccessful) {
                    sessionManager.clear()
                    Toast.makeText(this@ProfileActivity, "Account deactivated.", Toast.LENGTH_LONG).show()
                    val intent = Intent(this@ProfileActivity, LoginActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    startActivity(intent)
                    finish()
                } else {
                    showError(response.errorMessageOrDefault("Failed to deactivate account."))
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
