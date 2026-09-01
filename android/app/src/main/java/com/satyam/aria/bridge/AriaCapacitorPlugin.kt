package com.satyam.aria.bridge

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.hardware.camera2.CameraManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.core.content.ContextCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.satyam.aria.service.AriaAccessibilityService
import com.satyam.aria.service.AriaForegroundService
import com.satyam.aria.service.AriaNotificationListener

@CapacitorPlugin(
    name = "AriaNativeBridge",
    permissions = [
        Permission(strings = [Manifest.permission.RECORD_AUDIO], name = "microphone"),
        Permission(strings = [Manifest.permission.CAMERA], name = "camera"),
        Permission(strings = [Manifest.permission.POST_NOTIFICATIONS], name = "notifications"),
        Permission(strings = [Manifest.permission.READ_CONTACTS], name = "contacts"),
        Permission(strings = [Manifest.permission.CALL_PHONE], name = "phone"),
        Permission(strings = [Manifest.permission.SEND_SMS], name = "sms")
    ]
)
class AriaCapacitorPlugin : Plugin() {

    @PluginMethod
    fun checkNativePermissions(call: PluginCall) {
        val ctx = context
        val ret = JSObject()

        // 1. Microphone
        val micGranted = ContextCompat.checkSelfPermission(
            ctx,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED
        ret.put("microphone", micGranted)

        // 2. Accessibility
        val accessibilityRunning = AriaAccessibilityService.isServiceRunning()
        ret.put("accessibility", accessibilityRunning)

        // 3. Notification Listener
        val notifGranted = AriaNotificationListener.isNotificationAccessGranted(ctx)
        ret.put("notificationListener", notifGranted)

        // 4. Overlay / System Alert Window
        val overlayGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(ctx)
        } else true
        ret.put("overlay", overlayGranted)

        // 5. Battery optimization
        val pm = ctx.getSystemService(Context.POWER_SERVICE) as? PowerManager
        val batteryIgnored = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && pm != null) {
            pm.isIgnoringBatteryOptimizations(ctx.packageName)
        } else true
        ret.put("batteryOptimizationExempt", batteryIgnored)

        // 6. Camera
        val cameraGranted = ContextCompat.checkSelfPermission(
            ctx,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
        ret.put("camera", cameraGranted)

        // 7. Contacts
        val contactsGranted = ContextCompat.checkSelfPermission(
            ctx,
            Manifest.permission.READ_CONTACTS
        ) == PackageManager.PERMISSION_GRANTED
        ret.put("contacts", contactsGranted)

        // 8. Foreground Service Status
        ret.put("foregroundServiceRunning", AriaForegroundService.isServiceRunning())

        call.resolve(ret)
    }

    @PluginMethod
    fun openNativeSettings(call: PluginCall) {
        val target = call.getString("target") ?: "app"
        val ctx = context
        val intent: Intent = when (target.lowercase()) {
            "accessibility" -> Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            "notifications", "notification_listener" -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
                    Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
                } else {
                    Intent(Settings.ACTION_SETTINGS)
                }
            }
            "overlay" -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:${ctx.packageName}")
                    )
                } else {
                    Intent(Settings.ACTION_SETTINGS)
                }
            }
            "battery" -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                } else {
                    Intent(Settings.ACTION_SETTINGS)
                }
            }
            else -> {
                Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.fromParts("package", ctx.packageName, null)
                }
            }
        }

        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try {
            ctx.startActivity(intent)
            val res = JSObject()
            res.put("success", true)
            call.resolve(res)
        } catch (e: Exception) {
            call.reject("Failed to launch settings for target $target: ${e.message}")
        }
    }

    @PluginMethod
    fun performAccessibilityAction(call: PluginCall) {
        val service = AriaAccessibilityService.getInstance()
        if (service == null) {
            val res = JSObject()
            res.put("success", false)
            res.put("error", "Accessibility Service is not enabled. Please enable it in Android Settings.")
            call.resolve(res)
            return
        }

        val action = call.getString("action") ?: ""
        var success = false

        when (action.lowercase()) {
            "back", "home", "recents", "notifications", "quick_settings" -> {
                success = service.performGlobal(action)
            }
            "click_text" -> {
                val text = call.getString("text") ?: ""
                val exact = call.getBoolean("exact", false) ?: false
                success = service.clickElementByText(text, exact)
            }
            "scroll" -> {
                val direction = call.getString("direction") ?: "down"
                success = service.scrollScreen(direction)
            }
            "type_text" -> {
                val text = call.getString("text") ?: ""
                success = service.typeTextIntoFocused(text)
            }
            "extract_text" -> {
                val summary = service.extractScreenTextSummary()
                val res = JSObject()
                res.put("success", true)
                res.put("summary", summary)
                call.resolve(res)
                return
            }
            else -> {
                call.reject("Unsupported accessibility action: $action")
                return
            }
        }

        val res = JSObject()
        res.put("success", success)
        call.resolve(res)
    }

    @PluginMethod
    fun getNativeNotifications(call: PluginCall) {
        val listener = AriaNotificationListener.getInstance()
        val ret = JSObject()
        if (listener != null) {
            val jsonStr = listener.getActiveNotificationsJson()
            ret.put("notifications", jsonStr)
            ret.put("isListenerActive", true)
        } else {
            ret.put("notifications", "[]")
            ret.put("isListenerActive", false)
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun toggleForegroundService(call: PluginCall) {
        val enable = call.getBoolean("enable", true) ?: true
        val ctx = context
        if (enable) {
            AriaForegroundService.start(ctx)
        } else {
            AriaForegroundService.stop(ctx)
        }
        val ret = JSObject()
        ret.put("running", enable)
        call.resolve(ret)
    }

    @PluginMethod
    fun toggleFlashlight(call: PluginCall) {
        val enable = call.getBoolean("enable", false) ?: false
        try {
            val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as? CameraManager
            val cameraId = cameraManager?.cameraIdList?.firstOrNull()
            if (cameraId != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                cameraManager.setTorchMode(cameraId, enable)
                val ret = JSObject()
                ret.put("success", true)
                ret.put("state", enable)
                call.resolve(ret)
                return
            }
        } catch (e: Exception) {
            call.reject("Flashlight control failed: ${e.message}")
            return
        }
        call.reject("Flashlight not supported on this device")
    }
}
