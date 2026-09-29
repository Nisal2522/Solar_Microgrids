// -----------------------------------------------------------------------------
// File: ScanActivity.kt
// Purpose: Grid Operator camera screen — live-scans a prosumer's QR code
//          with CameraX + ML Kit, sends the decoded token to the API for
//          verification, and opens the transfer-confirmation screen once
//          the server confirms it matches an Approved reservation.
// Module owner: Member D (Grid Operator Verification)
// -----------------------------------------------------------------------------
package com.solarmicrogrid.app.operator

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import com.solarmicrogrid.app.data.model.VerifyQrRequest
import com.solarmicrogrid.app.data.remote.RetrofitClient
import com.solarmicrogrid.app.databinding.ActivityScanBinding
import com.solarmicrogrid.app.util.Constants
import com.solarmicrogrid.app.util.errorMessageOrDefault
import kotlinx.coroutines.launch
import java.util.concurrent.Executors

class ScanActivity : AppCompatActivity() {

    private lateinit var binding: ActivityScanBinding
    private val cameraPermissionCode = 2001
    private var isProcessing = false

    // Requests camera permission (if needed) and starts the preview.
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityScanBinding.inflate(layoutInflater)
        setContentView(binding.root)

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            startCamera()
        } else {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA), cameraPermissionCode)
        }
    }

    // Reacts to the camera permission prompt's result.
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == cameraPermissionCode && grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            startCamera()
        } else {
            binding.textStatus.text = "Camera permission is required to scan QR codes."
        }
    }

    // Binds the CameraX preview + ML Kit barcode analyzer to this activity's lifecycle.
    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()

            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(binding.previewView.surfaceProvider)
            }

            val scannerOptions = BarcodeScannerOptions.Builder()
                .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
                .build()
            val scanner = BarcodeScanning.getClient(scannerOptions)

            val analysis = ImageAnalysis.Builder().build()
            analysis.setAnalyzer(Executors.newSingleThreadExecutor()) { imageProxy ->
                processFrame(imageProxy, scanner)
            }

            cameraProvider.unbindAll()
            cameraProvider.bindToLifecycle(this, CameraSelector.DEFAULT_BACK_CAMERA, preview, analysis)
        }, ContextCompat.getMainExecutor(this))
    }

    // Runs ML Kit barcode detection on one camera frame and hands off the first QR match.
    @androidx.camera.core.ExperimentalGetImage
    private fun processFrame(imageProxy: ImageProxy, scanner: com.google.mlkit.vision.barcode.BarcodeScanner) {
        val mediaImage = imageProxy.image
        if (mediaImage == null || isProcessing) {
            imageProxy.close()
            return
        }

        val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
        scanner.process(image)
            .addOnSuccessListener { barcodes ->
                val token = barcodes.firstOrNull()?.rawValue
                if (token != null && !isProcessing) {
                    isProcessing = true
                    verifyToken(token)
                }
            }
            .addOnCompleteListener { imageProxy.close() }
    }

    // Sends the scanned token to the API; opens the confirmation screen if it verifies.
    private fun verifyToken(token: String) {
        binding.textStatus.text = "Verifying..."
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.getApiService(this@ScanActivity).verifyQr(VerifyQrRequest(token))
                if (response.isSuccessful && response.body() != null) {
                    val reservation = response.body()!!
                    val intent = Intent(this@ScanActivity, TransferConfirmActivity::class.java)
                    intent.putExtra(Constants.EXTRA_RESERVATION_ID, reservation.id)
                    startActivity(intent)
                    finish()
                } else {
                    binding.textStatus.text = response.errorMessageOrDefault("QR verification failed.")
                    isProcessing = false
                }
            } catch (e: Exception) {
                binding.textStatus.text = "Could not reach the server. Check your connection."
                isProcessing = false
            }
        }
    }
}
