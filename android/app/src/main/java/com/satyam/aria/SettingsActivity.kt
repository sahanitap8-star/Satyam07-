package com.satyam.aria

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.satyam.aria.service.AriaAccessibilityService
import com.satyam.aria.service.AriaForegroundService
import com.satyam.aria.service.AriaNotificationListener

class SettingsActivity : AppCompatActivity() {

    private lateinit var contentLayout: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val scrollView = ScrollView(this).apply {
            setBackgroundColor(Color.parseColor("#02080B"))
            isFillViewport = true
        }

        contentLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 64, 48, 64)
        }

        scrollView.addView(contentLayout)
        setContentView(scrollView)

        buildUi()
    }

    override fun onResume() {
        super.onResume()
        buildUi()
    }

    private fun buildUi() {
        contentLayout.removeAllViews()

        // Title
        val titleText = TextView(this).apply {
            text = "ARIA AI - Native Settings & Permissions"
            textSize = 22f
            setTextColor(Color.parseColor("#22D3EE"))
            gravity = Gravity.CENTER_HORIZONTAL
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            setPadding(0, 0, 0, 16)
        }
        contentLayout.addView(titleText)

        // Subtitle
        val subText = TextView(this).apply {
            text = "Manage system permissions and deep Android OS integration services."
            textSize = 14f
            setTextColor(Color.parseColor("#94A3B8"))
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(0, 0, 0, 48)
        }
        contentLayout.addView(subText)

        // Status Cards
        addSettingCard(
            title = "1. Accessibility Service",
            desc = "Allows ARIA to navigate screens, tap buttons, and type text on your behalf.",
            isGranted = AriaAccessibilityService.isServiceRunning(),
            buttonLabel = "Configure Accessibility",
            onClick = {
                startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
            }
        )

        addSettingCard(
            title = "2. Notification Intelligence",
            desc = "Enables ARIA to read active notifications and summarize alerts.",
            isGranted = AriaNotificationListener.isNotificationAccessGranted(this),
            buttonLabel = "Configure Notification Access",
            onClick = {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
                    startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
                }
            }
        )

        val micGranted = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED

        addSettingCard(
            title = "3. Microphone & Voice",
            desc = "Required for real-time speech interaction and Gemini Live voice stream.",
            isGranted = micGranted,
            buttonLabel = "Manage App Permissions",
            onClick = {
                val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.fromParts("package", packageName, null)
                }
                startActivity(intent)
            }
        )

        val pm = getSystemService(Context.POWER_SERVICE) as? PowerManager
        val batteryExempt = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && pm != null) {
            pm.isIgnoringBatteryOptimizations(packageName)
        } else true

        addSettingCard(
            title = "4. Background Battery Optimization",
            desc = "Prevents Android OS from killing the assistant service in the background.",
            isGranted = batteryExempt,
            buttonLabel = "Manage Battery Restrictions",
            onClick = {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
                }
            }
        )

        // Close Button
        val closeBtn = Button(this).apply {
            text = "Back to Assistant"
            setTextColor(Color.BLACK)
            setBackgroundColor(Color.parseColor("#22D3EE"))
            setPadding(32, 24, 32, 24)
            setOnClickListener { finish() }
        }
        val closeParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            topMargin = 48
        }
        contentLayout.addView(closeBtn, closeParams)
    }

    private fun addSettingCard(
        title: String,
        desc: String,
        isGranted: Boolean,
        buttonLabel: String,
        onClick: () -> Unit
    ) {
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(36, 36, 36, 36)
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#0F172A"))
                cornerRadius = 24f
                setStroke(2, if (isGranted) Color.parseColor("#059669") else Color.parseColor("#334155"))
            }
        }

        val headerRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val titleView = TextView(this).apply {
            text = title
            textSize = 16f
            setTextColor(Color.WHITE)
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }
        headerRow.addView(titleView)

        val badge = TextView(this).apply {
            text = if (isGranted) "ACTIVE" else "DISABLED"
            textSize = 11f
            setTextColor(if (isGranted) Color.parseColor("#34D399") else Color.parseColor("#F87171"))
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            setPadding(16, 8, 16, 8)
            background = GradientDrawable().apply {
                setColor(if (isGranted) Color.parseColor("#064E3B") else Color.parseColor("#450A0A"))
                cornerRadius = 12f
            }
        }
        headerRow.addView(badge)
        card.addView(headerRow)

        val descView = TextView(this).apply {
            text = desc
            textSize = 13f
            setTextColor(Color.parseColor("#94A3B8"))
            setPadding(0, 16, 0, 24)
        }
        card.addView(descView)

        val actionBtn = Button(this).apply {
            text = buttonLabel
            textSize = 13f
            setTextColor(Color.WHITE)
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#1E293B"))
                cornerRadius = 16f
                setStroke(1, Color.parseColor("#475569"))
            }
            setOnClickListener { onClick() }
        }
        card.addView(actionBtn)

        val params = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            bottomMargin = 32
        }
        contentLayout.addView(card, params)
    }
}
