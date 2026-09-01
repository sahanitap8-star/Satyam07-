package com.satyam.aria.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.util.Log
import androidx.preference.PreferenceManager
import com.satyam.aria.service.AriaForegroundService

/**
 * AriaBootReceiver handles device boot completion to restore user-configured
 * assistant background presence if enabled in settings.
 * 
 * SECURITY MANDATE:
 * - Does NOT record audio silently or perform sensitive actions without user intent.
 * - Restores foreground service only if user explicitly toggled "Start at boot".
 */
class AriaBootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "AriaBootReceiver"
        const val PREF_START_ON_BOOT = "pref_start_on_boot"
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null || intent == null) return

        val action = intent.action
        if (action == Intent.ACTION_BOOT_COMPLETED || action == "android.intent.action.QUICKBOOT_POWERON") {
            Log.i(TAG, "Device boot completed received.")

            val prefs: SharedPreferences = PreferenceManager.getDefaultSharedPreferences(context)
            val startOnBoot = prefs.getBoolean(PREF_START_ON_BOOT, false)

            if (startOnBoot) {
                Log.i(TAG, "Starting Aria Foreground Service per user preference.")
                AriaForegroundService.start(context)
            } else {
                Log.d(TAG, "Start on boot is disabled; assistant idle.")
            }
        }
    }
}
