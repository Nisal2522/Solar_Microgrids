// -----------------------------------------------------------------------------
// File: RegisterActivity.kt
// Purpose: Prosumer self-registration screen — NIC as primary key, submits
//          to the API and starts the account in PendingActivation until a
//          Backoffice officer approves it from the web app.
// Module owner: Member A (Identity & Access)
// -----------------------------------------------------------------------------
package com.solarmicrogrid.app.auth

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.solarmicrogrid.app.data.model.RegisterProsumerRequest
import com.solarmicrogrid.app.data.remote.RetrofitClient
import com.solarmicrogrid.app.databinding.ActivityRegisterBinding
import com.solarmicrogrid.app.util.applyEdgeToEdgeInsets
import com.solarmicrogrid.app.util.errorMessageOrDefault
import kotlinx.coroutines.launch

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding

    // Wires the registration form submit action.
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)
        applyEdgeToEdgeInsets(topInsetView = binding.heroSection)

        binding.buttonRegister.setOnClickListener { submitRegistration() }
    }

    // Validates the form and posts the registration request to the API.
    private fun submitRegistration() {
        val nic = binding.inputNic.text.toString().trim()
        val fullName = binding.inputFullName.text.toString().trim()
        val email = binding.inputEmail.text.toString().trim()
        val phone = binding.inputPhone.text.toString().trim()
        val address = binding.inputAddress.text.toString().trim()
        val password = binding.inputPassword.text.toString()

        if (listOf(nic, fullName, email, phone, address, password).any { it.isEmpty() }) {
            showError("Please fill in every field.")
            return
        }

        binding.buttonRegister.isEnabled = false
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.getApiService(this@RegisterActivity)
                    .registerProsumer(RegisterProsumerRequest(nic, fullName, email, phone, address, password))
                if (response.isSuccessful) {
                    Toast.makeText(
                        this@RegisterActivity,
                        "Registered! Your account is pending Backoffice activation.",
                        Toast.LENGTH_LONG
                    ).show()
                    finish()
                } else {
                    showError(response.errorMessageOrDefault("Registration failed."))
                }
            } catch (e: Exception) {
                showError("Could not reach the server. Check your connection.")
            } finally {
                binding.buttonRegister.isEnabled = true
            }
        }
    }

    // Shows the inline error banner above the form.
    private fun showError(message: String) {
        binding.textError.text = message
        binding.errorBanner.visibility = View.VISIBLE
    }
}
