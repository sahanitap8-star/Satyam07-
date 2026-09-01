package com.satyam.aria

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.getcapacitor.BridgeActivity
import com.satyam.aria.bridge.AriaCapacitorPlugin
import com.satyam.aria.service.AriaForegroundService

class MainActivity : BridgeActivity() {

    companion object {
        private const val TAG = "MainActivity"
        private const val PERMISSION_REQUEST_CODE = 1002
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        // Register custom native bridge plugin before super.onCreate
        registerPlugin(AriaCapacitorPlugin::class.java)
        super.onCreate(savedInstanceState)

        Log.i(TAG, "ARIA AI MainActivity initialized.")

        // Check and request runtime permissions safely
        requestEssentialPermissions()

        // Handle voice assistant invocation intents
        handleAssistantIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleAssistantIntent(intent)
    }

    private fun handleAssistantIntent(intent: Intent?) {
        if (intent == null) return
        val action = intent.action
        if (action == Intent.ACTION_ASSIST || action == Intent.ACTION_VOICE_COMMAND) {
            Log.i(TAG, "Aria triggered via Android Assistant action: $action")
            // Notify the web layer to start active listening session
            bridge?.eval("window.dispatchEvent(new CustomEvent('aria-voice-assist-trigger'));", null)
        }
    }

    private fun requestEssentialPermissions() {
        val permissionsToRequest = mutableListOf<String>()

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.RECORD_AUDIO)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                permissionsToRequest.toTypedArray(),
                PERMISSION_REQUEST_CODE
            )
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            Log.i(TAG, "Permissions resolved. Bridge ready.")
        }
    }
}
