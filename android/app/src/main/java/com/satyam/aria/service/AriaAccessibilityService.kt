package com.satyam.aria.service

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.graphics.Rect
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * AriaAccessibilityService provides user-authorized assistance for UI navigation,
 * clicking buttons, scrolling, and inputting text on behalf of the user.
 * 
 * SECURITY MANDATE:
 * - Operates ONLY with explicit user permission via Android Accessibility Settings.
 * - NEVER captures passwords, PINs, or sensitive credentials.
 * - NEVER attempts to bypass Android lock screen or biometric security.
 */
class AriaAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "AriaAccessibility"
        private var instance: AriaAccessibilityService? = null

        fun getInstance(): AriaAccessibilityService? = instance
        fun isServiceRunning(): Boolean = instance != null
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i(TAG, "AriaAccessibilityService connected and ready.")

        serviceInfo = serviceInfo.apply {
            eventTypes = AccessibilityEvent.TYPES_ALL_MASK
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC or AccessibilityServiceInfo.FEEDBACK_SPOKEN
            flags = flags or
                    AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                    AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS or
                    AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
            notificationTimeout = 50
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Safe logging of UI state transitions if needed
        if (event == null) return
        val eventType = event.eventType
        if (eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val pkg = event.packageName?.toString() ?: ""
            val cls = event.className?.toString() ?: ""
            Log.d(TAG, "Window State Changed: $pkg / $cls")
        }
    }

    override fun onInterrupt() {
        Log.w(TAG, "AriaAccessibilityService interrupted.")
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        Log.i(TAG, "AriaAccessibilityService destroyed.")
    }

    // ==========================================
    // ASSISTANT ACTION EXECUTION ENGINE
    // ==========================================

    /**
     * Performs standard global navigation actions (Back, Home, Recents, Notifications).
     */
    fun performGlobal(actionType: String): Boolean {
        return when (actionType.lowercase()) {
            "back" -> performGlobalAction(GLOBAL_ACTION_BACK)
            "home" -> performGlobalAction(GLOBAL_ACTION_HOME)
            "recents" -> performGlobalAction(GLOBAL_ACTION_RECENTS)
            "notifications" -> performGlobalAction(GLOBAL_ACTION_NOTIFICATIONS)
            "quick_settings" -> performGlobalAction(GLOBAL_ACTION_QUICK_SETTINGS)
            "lock_screen" -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    performGlobalAction(GLOBAL_ACTION_LOCK_SCREEN)
                } else false
            }
            else -> false
        }
    }

    /**
     * Scans active window content and clicks on an element matching text or viewId.
     */
    fun clickElementByText(targetText: String, exactMatch: Boolean = false): Boolean {
        val root = rootInActiveWindow ?: return false
        try {
            val matchingNodes = mutableListOf<AccessibilityNodeInfo>()
            findNodesByTextRecursive(root, targetText.lowercase(), exactMatch, matchingNodes)

            for (node in matchingNodes) {
                if (performClickOnNodeOrParent(node)) {
                    Log.i(TAG, "Successfully clicked element matching: $targetText")
                    return true
                }
            }
        } finally {
            root.recycle()
        }
        return false
    }

    private fun findNodesByTextRecursive(
        node: AccessibilityNodeInfo?,
        targetText: String,
        exactMatch: Boolean,
        results: MutableList<AccessibilityNodeInfo>
    ) {
        if (node == null) return
        val text = node.text?.toString()?.lowercase()
        val desc = node.contentDescription?.toString()?.lowercase()

        val matched = if (exactMatch) {
            text == targetText || desc == targetText
        } else {
            (text != null && text.contains(targetText)) || (desc != null && desc.contains(targetText))
        }

        if (matched) {
            results.add(node)
        }

        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            findNodesByTextRecursive(child, targetText, exactMatch, results)
        }
    }

    private fun performClickOnNodeOrParent(node: AccessibilityNodeInfo?): Boolean {
        var current = node
        while (current != null) {
            if (current.isClickable) {
                val clicked = current.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                if (clicked) return true
            }
            current = current.parent
        }
        return false
    }

    /**
     * Scrolls the current scrollable view forward or backward.
     */
    fun scrollScreen(direction: String): Boolean {
        val root = rootInActiveWindow ?: return false
        try {
            val scrollable = findFirstScrollableNode(root) ?: return false
            val action = if (direction.equals("down", true) || direction.equals("forward", true)) {
                AccessibilityNodeInfo.ACTION_SCROLL_FORWARD
            } else {
                AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD
            }
            return scrollable.performAction(action)
        } finally {
            root.recycle()
        }
    }

    private fun findFirstScrollableNode(node: AccessibilityNodeInfo?): AccessibilityNodeInfo? {
        if (node == null) return null
        if (node.isScrollable) return node
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val result = findFirstScrollableNode(child)
            if (result != null) return result
        }
        return null
    }

    /**
     * Inputs text into the currently focused editable field.
     */
    fun typeTextIntoFocused(textToType: String): Boolean {
        val root = rootInActiveWindow ?: return false
        try {
            val focusedNode = root.findFocus(AccessibilityNodeInfo.FOCUS_INPUT)
            if (focusedNode != null && focusedNode.isEditable) {
                val arguments = Bundle().apply {
                    putCharSequence(
                        AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE,
                        textToType
                    )
                }
                return focusedNode.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments)
            }
        } finally {
            root.recycle()
        }
        return false
    }

    /**
     * Performs a gesture swipe across specified coordinates.
     */
    fun performSwipeGesture(startX: Float, startY: Float, endX: Float, endY: Float, durationMs: Long = 300): Boolean {
        val path = Path().apply {
            moveTo(startX, startY)
            lineTo(endX, endY)
        }
        val stroke = GestureDescription.StrokeDescription(path, 0, durationMs)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()
        return dispatchGesture(gesture, null, null)
    }

    /**
     * Retrieves visible text on the active screen for assistant contextual awareness.
     */
    fun extractScreenTextSummary(maxChars: Int = 1000): String {
        val root = rootInActiveWindow ?: return "Screen context unavailable"
        val sb = java.lang.StringBuilder()
        try {
            collectTextRecursive(root, sb, maxChars)
        } finally {
            root.recycle()
        }
        return sb.toString().trim()
    }

    private fun collectTextRecursive(node: AccessibilityNodeInfo?, sb: java.lang.StringBuilder, maxChars: Int) {
        if (node == null || sb.length >= maxChars) return
        val text = node.text?.toString()?.trim()
        val desc = node.contentDescription?.toString()?.trim()

        if (!text.isNullOrBlank()) {
            sb.append(text).append(" | ")
        } else if (!desc.isNullOrBlank()) {
            sb.append(desc).append(" | ")
        }

        for (i in 0 until node.childCount) {
            if (sb.length >= maxChars) break
            val child = node.getChild(i) ?: continue
            collectTextRecursive(child, sb, maxChars)
        }
    }
}
