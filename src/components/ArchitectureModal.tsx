import React, { useState } from "react";
import { motion } from "motion/react";
import { Layers, X, Copy, Check, Code, ShieldCheck, Cpu, Terminal } from "lucide-react";

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ArchitectureModal({ isOpen, onClose }: ArchitectureModalProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"accessibility" | "notifications" | "intents" | "manifest">("accessibility");

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    } catch (e) {
      console.warn("Clipboard access not permitted:", e);
    }
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const ACCESSIBILITY_CODE = `// AriaAccessibilityService.kt
package com.satyam.aria.service

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class AriaAccessibilityService : AccessibilityService() {

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        val rootNode = rootInActiveWindow ?: return
        // Real-time screen parsing for Aria AI Screen Vision & UI hierarchy
    }

    fun performTap(x: Float, y: Float) {
        val path = Path().apply { moveTo(x, y) }
        val stroke = GestureDescription.StrokeDescription(path, 0, 50)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()
        dispatchGesture(gesture, null, null)
    }

    fun performScroll(direction: Int) {
        rootInActiveWindow?.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD)
    }

    fun triggerGlobalBack() = performGlobalAction(GLOBAL_ACTION_BACK)
    fun triggerGlobalHome() = performGlobalAction(GLOBAL_ACTION_HOME)
    fun triggerGlobalRecents() = performGlobalAction(GLOBAL_ACTION_RECENTS)

    override fun onInterrupt() {}
}`;

  const NOTIFICATION_LISTENER_CODE = `// AriaNotificationListener.kt
package com.satyam.aria.service

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

class AriaNotificationListener : NotificationListenerService() {

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        val packageName = sbn?.packageName ?: return
        val extras = sbn.notification.extras
        val title = extras.getString("android.title") ?: ""
        val text = extras.getCharSequence("android.text")?.toString() ?: ""

        // Forward to Aria Action Layer & Gemini Context Engine
        AriaEventBus.publishNotification(packageName, title, text)
    }

    fun dismissNotificationKey(key: String) {
        cancelNotification(key)
    }
}`;

  const INTENT_BRIDGE_CODE = `// AriaIntentBridge.kt
package com.satyam.aria.bridge

import android.content.Context
import android.content.Intent
import android.net.Uri

object AriaIntentBridge {

    fun makeCall(context: Context, phoneNumber: String) {
        val intent = Intent(Intent.ACTION_CALL, Uri.parse("tel:$phoneNumber")).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }

    fun sendSMS(context: Context, phone: String, message: String) {
        val uri = Uri.parse("smsto:$phone")
        val intent = Intent(Intent.ACTION_SENDTO, uri).apply {
            putExtra("sms_body", message)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }

    fun launchAppByPackage(context: Context, packageName: String) {
        val launchIntent = context.packageManager.getLaunchIntentForPackage(packageName)
        if (launchIntent != null) {
            context.startActivity(launchIntent)
        }
    }
}`;

  return (
    <div
      id="architecture-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        className="bg-[#0b101c] border border-cyan-500/30 rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <Cpu size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Android Action Layer & Native Architecture
              </h2>
              <p className="text-[11px] text-white/50">
                Kotlin & Android OS Bridge specification for Aria Assistant
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 bg-black/20 px-4 pt-2 gap-2">
          {[
            { id: "accessibility", label: "AccessibilityService", code: ACCESSIBILITY_CODE },
            { id: "notifications", label: "NotificationListener", code: NOTIFICATION_LISTENER_CODE },
            { id: "intents", label: "IntentBridge (Calls/SMS)", code: INTENT_BRIDGE_CODE },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-xs font-mono border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-cyan-400 text-cyan-300 font-semibold"
                  : "border-transparent text-white/60 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#070a14] relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-white/40 flex items-center gap-1.5">
              <Terminal size={14} className="text-cyan-400" />
              Production Android Service Blueprint
            </span>
            <button
              onClick={() => {
                const code =
                  activeTab === "accessibility"
                    ? ACCESSIBILITY_CODE
                    : activeTab === "notifications"
                    ? NOTIFICATION_LISTENER_CODE
                    : INTENT_BRIDGE_CODE;
                copyToClipboard(code, activeTab);
              }}
              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 text-xs font-mono flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
            >
              {copiedSection === activeTab ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedSection === activeTab ? "Copied!" : "Copy Kotlin Code"}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-black/60 border border-white/10 text-cyan-300 font-mono text-xs overflow-x-auto leading-relaxed">
            {activeTab === "accessibility"
              ? ACCESSIBILITY_CODE
              : activeTab === "notifications"
              ? NOTIFICATION_LISTENER_CODE
              : INTENT_BRIDGE_CODE}
          </pre>
        </div>
      </motion.div>
    </div>
  );
}
