// -----------------------------------------------------------------------------
// File: LoginActivity.kt
// Purpose: App entry point. Skips straight to the role-appropriate home
//          screen if a session is already saved in SQLite; otherwise
//          authenticates against the API and routes by returned userType.
// Module owner: Member A (Identity & Access)
// -----------------------------------------------------------------------------
package com.solarmicrogrid.app.auth

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.lifecycle.lifecycleScope
import com.solarmicrogrid.app.data.local.SessionManager
import com.solarmicrogrid.app.data.model.LoginRequest
import com.solarmicrogrid.app.data.remote.RetrofitClient
import com.solarmicrogrid.app.databinding.ActivityLoginBinding
import com.solarmicrogrid.app.operator.OperatorHomeActivity
import com.solarmicrogrid.app.prosumer.ProsumerHomeActivity
import com.solarmicrogrid.app.util.errorMessageOrDefault
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private lateinit var sessionManager: SessionManager

    // Sets up bindings, redirects if already logged in, and wires the form.
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        sessionManager = SessionManager(this)

        sessionManager.current()?.let { session ->
            routeToHome(session.userType)
            return
        }

        binding.buttonLogin.setOnClickListener { attemptLogin() }
        binding.textGoRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }

    // Submits the identifier/password to the API and saves the session on success.
    private fun attemptLogin() {
        val identifier = binding.inputIdentifier.text.toString().trim()
        val password = binding.inputPassword.text.toString()
        if (identifier.isEmpty() || password.isEmpty()) {
            showError("Please enter both fields.")
            return
        }

        binding.buttonLogin.isEnabled = false
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.getApiService(this@LoginActivity).login(LoginRequest(identifier, password))
                if (response.isSuccessful && response.body() != null) {
                    val login = response.body()!!
                    sessionManager.save(login)
                    routeToHome(login.userType)
                } else {
                    showError(response.errorMessageOrDefault("Invalid credentials."))
                }
            } catch (e: Exception) {
                showError("Could not reach the server. Check your connection.")
            } finally {
                binding.buttonLogin.isEnabled = true
            }
        }
    }

    // Navigates to the Prosumer or Grid Operator home screen based on role.
    private fun routeToHome(userType: String) {
        val destination = if (userType == "Prosumer") ProsumerHomeActivity::class.java else OperatorHomeActivity::class.java
        startActivity(Intent(this, destination))
        finish()
    }

    // Shows the inline error banner above the form.
    private fun showError(message: String) {
        binding.textError.text = message
        binding.errorBanner.visibility = android.view.View.VISIBLE
    }
}
