package com.satyam.aria.service

import android.app.Notification
import android.content.ComponentName
import android.content.Context
import android.os.Build
import android.provider.Settings
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject

/**
 * AriaNotificationListener enables user-authorized notification reading and intelligence.
 * 
 * SECURITY MANDATE:
 * - Operates ONLY with explicit user permission in Android Notification Listener Settings.
 * - Extracts only safe, public notification titles and bodies.
 * - Handles service lifecycle safely without crashing if permission is revoked.
 */
class AriaNotificationListener : NotificationListenerService() {

    companion object {
        private const val TAG = "AriaNotificationListener"
        private var instance: AriaNotificationListener? = null

        fun getInstance(): AriaNotificationListener? = instance
        fun isServiceConnected(): Boolean = instance != null

        fun isNotificationAccessGranted(context: Context): Boolean {
            val packageName = context.packageName
            val flat = Settings.Secure.getString(
                context.contentResolver,
                "enabled_notification_listeners"
            )
            return flat != null && flat.contains(packageName)
        }
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        instance = this
        Log.i(TAG, "Aria Notification Listener connected.")
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        instance = null
        Log.i(TAG, "Aria Notification Listener disconnected.")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        if (sbn == null) return
        val pkg = sbn.packageName ?: ""
        // Ignore self-notifications to prevent feedback loops
        if (pkg == packageName) return

        val extras = sbn.notification.extras ?: return
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""

        if (title.isNotEmpty() || text.isNotEmpty()) {
            Log.d(TAG, "Notification received from [$pkg]: $title - $text")
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        if (sbn == null) return
        Log.d(TAG, "Notification removed: ${sbn.packageName}")
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }

    /**
     * Exposes active notifications formatted for the Assistant JSON bridge.
     */
    fun getActiveNotificationsJson(): String {
        val result = JSONArray()
        try {
            val active = activeNotifications ?: return "[]"
            for (sbn in active) {
                if (sbn.packageName == packageName) continue
                val extras = sbn.notification.extras ?: continue
                val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
                val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
                val subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString() ?: ""

                if (title.isEmpty() && text.isEmpty()) continue

                val item = JSONObject().apply {
                    put("id", sbn.id.toString())
                    put("packageName", sbn.packageName)
                    put("title", title)
                    put("body", text)
                    put("subText", subText)
                    put("postTime", sbn.postTime)
                    put("isOngoing", sbn.isOngoing)
                    put("isClearable", sbn.isClearable)
                }
                result.put(item)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching active notifications", e)
        }
        return result.toString()
    }
}
