import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  X,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ExternalLink,
  Copy,
  Check,
  FileCode,
  Sliders,
  ChevronDown,
  ChevronUp,
  Info,
  Mic,
  Camera,
  Users,
  Phone,
  MessageSquare,
  MapPin,
  Bluetooth,
  Globe,
  Bell,
  Eye,
  Layers,
  Moon,
  Vibrate,
  Power,
  Clock,
  Battery,
  Settings as SettingsIcon,
  PlaySquare,
  FolderOpen,
  ShieldAlert,
} from "lucide-react";
import {
  ANDROID_PERMISSIONS_CAPABILITIES,
  AndroidCapabilityItem,
  executeCapabilityAction,
  PermissionCategory,
} from "../services/androidPermissionService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AndroidPermissionsModal({ isOpen, onClose }: Props) {
  const [activeCategory, setActiveCategory] = useState<"all" | PermissionCategory | "manifest">("all");
  const [expandedId, setExpandedId] = useState<string | null>("microphone");
  const [actionFeedback, setActionFeedback] = useState<{
    id: string;
    message: string;
    success: boolean;
  } | null>(null);
  const [copiedManifest, setCopiedManifest] = useState(false);

  if (!isOpen) return null;

  const handleAction = async (item: AndroidCapabilityItem) => {
    setActionFeedback({
      id: item.id,
      message: "Processing capability request...",
      success: true,
    });

    const res = await executeCapabilityAction(item);
    setActionFeedback({
      id: item.id,
      message: res.message,
      success: res.success,
    });

    setTimeout(() => {
      // Keep message visible for readability
    }, 4000);
  };

  const getIconForCapability = (id: string) => {
    switch (id) {
      case "microphone":
        return Mic;
      case "camera":
        return Camera;
      case "contacts":
        return Users;
      case "phone":
        return Phone;
      case "sms":
        return MessageSquare;
      case "location":
        return MapPin;
      case "bluetooth":
        return Bluetooth;
      case "network":
        return Globe;
      case "notifications":
        return Bell;
      case "notification_listener":
        return Eye;
      case "accessibility_service":
        return Sliders;
      case "floating_overlay":
        return Layers;
      case "foreground_service":
        return Power;
      case "dnd_policy":
        return Moon;
      case "vibration":
        return Vibrate;
      case "boot_completed":
        return Power;
      case "exact_alarm":
        return Clock;
      case "battery_optimization":
        return Battery;
      case "android_settings":
        return SettingsIcon;
      case "media_control":
        return PlaySquare;
      case "file_access":
        return FolderOpen;
      case "security_boundaries":
        return ShieldAlert;
      default:
        return Shield;
    }
  };

  const filteredItems =
    activeCategory === "all"
      ? ANDROID_PERMISSIONS_CAPABILITIES
      : activeCategory === "manifest"
      ? []
      : ANDROID_PERMISSIONS_CAPABILITIES.filter((i) => i.category === activeCategory);

  const ANDROID_MANIFEST_PREVIEW = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.satyam.aria">

    <!-- 1. MICROPHONE -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />

    <!-- 2. CAMERA -->
    <uses-permission android:name="android.permission.CAMERA" />

    <!-- 3. CONTACTS -->
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.WRITE_CONTACTS" />

    <!-- 4. PHONE -->
    <uses-permission android:name="android.permission.CALL_PHONE" />
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />

    <!-- 5. SMS -->
    <uses-permission android:name="android.permission.READ_SMS" />
    <uses-permission android:name="android.permission.SEND_SMS" />
    <uses-permission android:name="android.permission.RECEIVE_SMS" />

    <!-- 6. LOCATION -->
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

    <!-- 7. BLUETOOTH -->
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />

    <!-- 8. INTERNET / NETWORK -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- 9. NOTIFICATIONS -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- 12. FLOATING OVERLAY -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

    <!-- 13. FOREGROUND SERVICE -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_CAMERA" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />

    <!-- 14. DND / NOTIFICATION POLICY -->
    <uses-permission android:name="android.permission.ACCESS_NOTIFICATION_POLICY" />

    <!-- 15. VIBRATION -->
    <uses-permission android:name="android.permission.VIBRATE" />

    <!-- 16. BOOT COMPLETED -->
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <!-- 17. EXACT ALARM -->
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />

    <!-- 18. BATTERY OPTIMIZATION -->
    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />

    <application ...>
        <!-- 10. NOTIFICATION LISTENER SERVICE -->
        <service android:name=".service.AriaNotificationListener"
            android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE" ... />

        <!-- 11. ACCESSIBILITY SERVICE -->
        <service android:name=".service.AriaAccessibilityService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE" ... />

        <!-- 13. FOREGROUND ASSISTANT SERVICE -->
        <service android:name=".service.AriaForegroundService"
            android:foregroundServiceType="microphone|camera|location" ... />

        <!-- 16. BOOT RECEIVER -->
        <receiver android:name=".receiver.AriaBootReceiver" ... />
    </application>
</manifest>`;

  const copyManifest = () => {
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(ANDROID_MANIFEST_PREVIEW).catch(() => {});
      }
    } catch (e) {
      console.warn("Clipboard access not permitted:", e);
    }
    setCopiedManifest(true);
    setTimeout(() => setCopiedManifest(false), 2000);
  };

  return (
    <div
      id="android-permissions-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className="bg-[#0b101c] border border-teal-500/30 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-wide">
                Android Permissions & Capabilities
              </h2>
              <p className="text-[11px] text-teal-400/80 font-mono">
                Official Android OS API Mapping, Special Access & Security Boundaries (22 Categories)
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

        {/* Filter Navigation */}
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 border-b border-white/10 bg-white/[0.02] overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === "all"
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            All Items (22)
          </button>
          <button
            onClick={() => setActiveCategory("runtime")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === "runtime"
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            Runtime Permissions (7)
          </button>
          <button
            onClick={() => setActiveCategory("special_access")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === "special_access"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            Special Access (6)
          </button>
          <button
            onClick={() => setActiveCategory("system_security")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === "system_security"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            Security Boundaries (1)
          </button>
          <button
            onClick={() => setActiveCategory("manifest")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeCategory === "manifest"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <FileCode size={13} />
            <span>AndroidManifest.xml</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[#070b14]">
          {activeCategory === "manifest" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-white/60 flex items-center gap-1.5">
                  <FileCode size={14} className="text-cyan-400" />
                  android/app/src/main/AndroidManifest.xml
                </span>
                <button
                  onClick={copyManifest}
                  className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 text-xs font-mono flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                >
                  {copiedManifest ? (
                    <Check size={14} className="text-emerald-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                  <span>{copiedManifest ? "Copied!" : "Copy Manifest XML"}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-black/70 border border-white/10 text-cyan-300 font-mono text-xs overflow-x-auto leading-relaxed max-h-[60vh]">
                {ANDROID_MANIFEST_PREVIEW}
              </pre>
            </div>
          ) : (
            filteredItems.map((item) => {
              const Icon = getIconForCapability(item.id);
              const isExpanded = expandedId === item.id;
              const feedback = actionFeedback?.id === item.id ? actionFeedback : null;

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border transition-all ${
                    item.category === "system_security"
                      ? "bg-purple-950/20 border-purple-500/40"
                      : item.category === "special_access"
                      ? "bg-amber-950/15 border-amber-500/30"
                      : "bg-white/[0.03] border-white/10"
                  }`}
                >
                  {/* Header Row */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl border ${
                          item.category === "system_security"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : item.category === "special_access"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                          {item.specialService && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                              {item.specialService}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/50 font-mono mt-0.5 truncate max-w-xs sm:max-w-md">
                          {item.permissions.length > 0
                            ? item.permissions.join(", ")
                            : "System Framework & Kernel Control"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border hidden sm:inline-flex ${
                          item.status === "granted"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                            : item.status === "special_access_required"
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                            : item.status === "security_restricted"
                            ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                            : "bg-blue-500/10 text-blue-300 border-blue-500/30"
                        }`}
                      >
                        {item.status === "granted"
                          ? "API Ready"
                          : item.status === "special_access_required"
                          ? "Special Access"
                          : item.status === "security_restricted"
                          ? "Non-Bypassable"
                          : "Runtime Prompt"}
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-white/40" />
                      ) : (
                        <ChevronDown size={16} className="text-white/40" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Body */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 pb-4 pt-1 border-t border-white/5 space-y-3"
                      >
                        {/* Capabilities List */}
                        {item.capabilities.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-white/70 font-mono uppercase tracking-wider">
                              Supported Capabilities:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {item.capabilities.map((cap, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs text-white/80 flex items-start gap-1.5 bg-black/30 p-2 rounded-lg border border-white/5"
                                >
                                  <CheckCircle2
                                    size={13}
                                    className="text-teal-400 shrink-0 mt-0.5"
                                  />
                                  <span>{cap}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Rules and Security Restrictions */}
                        {item.rules.length > 0 && (
                          <div className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-1">
                            <span className="text-[11px] font-mono text-amber-300/90 font-semibold flex items-center gap-1.5">
                              <AlertTriangle size={13} className="text-amber-400" />
                              Android OS Enforcement & Security Rules:
                            </span>
                            <ul className="text-xs text-white/70 space-y-1 pl-4 list-disc">
                              {item.rules.map((rule, idx) => (
                                <li key={idx}>{rule}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Security Boundaries if Present */}
                        {item.securityBoundaries && (
                          <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-500/30 space-y-1.5">
                            <span className="text-[11px] font-mono text-purple-300 font-semibold flex items-center gap-1.5">
                              <Lock size={13} className="text-purple-400" />
                              Kernel & Framework Security Restrictions:
                            </span>
                            <div className="space-y-1 text-xs text-purple-200/80 font-mono">
                              {item.securityBoundaries.map((boundary, idx) => (
                                <div key={idx}>• {boundary}</div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Settings Intent / Action Handler */}
                        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                          <div className="text-[11px] font-mono text-white/50">
                            {item.settingsIntent ? (
                              <span>Intent: {item.settingsIntent}</span>
                            ) : (
                              <span>Status: {item.statusDetail}</span>
                            )}
                          </div>

                          {item.actionLabel && (
                            <button
                              onClick={() => handleAction(item)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                item.category === "system_security"
                                  ? "bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30"
                                  : item.category === "special_access"
                                  ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30"
                                  : "bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30"
                              }`}
                            >
                              <ExternalLink size={13} />
                              <span>{item.actionLabel}</span>
                            </button>
                          )}
                        </div>

                        {/* Action feedback output */}
                        {feedback && (
                          <div
                            className={`p-2.5 rounded-lg text-xs font-mono border animate-in fade-in duration-150 ${
                              feedback.success
                                ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
                                : "bg-red-950/40 text-red-300 border-red-500/30"
                            }`}
                          >
                            {feedback.message}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
