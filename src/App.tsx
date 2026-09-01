import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Loader2,
  Volume2,
  VolumeX,
  Send,
  User,
  Sparkles,
  Settings,
  Grid,
  Bell,
  Folder,
  Layers,
  Shield,
  Languages,
  Radio,
  Keyboard,
  X,
  CornerDownLeft,
} from "lucide-react";
import { getAriaResponse, getAriaAudio, resetAriaSession } from "./services/geminiService";
import { processCommand, CommandResult } from "./services/commandService";
import { LiveSessionManager } from "./services/liveService";
import { WakeWordService } from "./services/wakeWordService";
import { MicrophoneManager, VoiceDiagnosticData } from "./services/microphoneManager";
import { getCurrentLanguageItem } from "./services/languageService";
import VoicePipelineDiagnosticModal from "./components/VoicePipelineDiagnosticModal";
import { Activity } from "lucide-react";
import Visualizer from "./components/Visualizer";
import PermissionModal from "./components/PermissionModal";
import NameModal from "./components/NameModal";
import ContactsCallsModal from "./components/ContactsCallsModal";
import MessagingModal from "./components/MessagingModal";
import CameraGalleryModal from "./components/CameraGalleryModal";
import MiniBrowserModal from "./components/MiniBrowserModal";
import SecurityConfirmModal from "./components/SecurityConfirmModal";
import SettingsModal from "./components/SettingsModal";
import PhoneAppsDrawer from "./components/PhoneAppsDrawer";
import FileManagerModal from "./components/FileManagerModal";
import NotificationCenter from "./components/NotificationCenter";
import ArchitectureModal from "./components/ArchitectureModal";
import AndroidPermissionsModal from "./components/AndroidPermissionsModal";
import MediaPlayerBar from "./components/MediaPlayerBar";
import { playPCM } from "./utils/audioUtils";
import { triggerWakeWordHaptic } from "./utils/hapticUtils";
import { Contact, SystemSettings, NotificationItem } from "./types/device";
import { motion, AnimatePresence } from "motion/react";

type AppState = "idle" | "listening" | "processing" | "speaking";

interface ChatMessage {
  id: string;
  sender: "user" | "aria" | "zoya";
  text: string;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem("aria_user_name") || "";
  });
  const [showNameModal, setShowNameModal] = useState<boolean>(() => {
    return !localStorage.getItem("aria_user_name");
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("aria_chat_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    return [];
  });
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
    localStorage.setItem("aria_chat_history", JSON.stringify(messages));
  }, [messages]);

  // SYSTEM SETTINGS
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    return {
      volume: 80,
      ringVolume: 80,
      alarmVolume: 80,
      brightness: 100,
      flashlight: false,
      wifi: true,
      bluetooth: true,
      mobileData: true,
      hotspot: false,
      dnd: false,
      autoRotate: true,
      soundMode: "sound",
      batteryLevel: 90,
      isCharging: false,
      batterySaver: false,
      wakeWordEnabled: true,
      activeWakeWord: "Hey Aria",
    };
  });

  // CONTACTS
  const [contacts, setContacts] = useState<Contact[]>([
    { id: "1", name: "Satyam Sahani", phone: "+91 98765 43210", avatarColor: "from-cyan-500 to-blue-500", isFavorite: true },
    { id: "2", name: "Rohan Sharma", phone: "+91 91234 56789", avatarColor: "from-emerald-500 to-teal-500" },
    { id: "3", name: "Ananya Patel", phone: "+91 99887 76655", avatarColor: "from-violet-500 to-purple-500" },
    { id: "4", name: "Pooja Verma", phone: "+91 98112 23344", avatarColor: "from-pink-500 to-rose-500" },
  ]);

  // NOTIFICATIONS
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: "1", appName: "WhatsApp", appIcon: "message", title: "Satyam Sahani", body: "Aria Android project update check kiya?", time: "5m ago" },
    { id: "2", appName: "Gmail", appIcon: "mail", title: "Google Cloud Alert", body: "Your Gemini 3.7 Flash API quota is active and healthy.", time: "1h ago" },
    { id: "3", appName: "Calendar", appIcon: "calendar", title: "Project Sync", body: "AI Studio review meeting at 4:00 PM", time: "2h ago" },
  ]);

  // MODAL STATES (for action fulfillment if triggered via voice or UI)
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [callTarget, setCallTarget] = useState<{ name: string; phone: string } | null>(null);
  const [smsTarget, setSmsTarget] = useState<{ phone: string; text: string; recipientName?: string } | null>(null);
  const [browserTarget, setBrowserTarget] = useState<{ url: string; query?: string } | null>(null);
  const [securityPrompt, setSecurityPrompt] = useState<{ title: string; risk: string; actionToPerform: string } | null>(null);
  const [cameraMode, setCameraMode] = useState<"camera" | "gallery">("camera");
  const [isPlayingMedia, setIsPlayingMedia] = useState(false);

  // AUDIO & CONTROLS
  const [isMuted, setIsMuted] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const textInputRef = useRef<HTMLInputElement | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<VoiceDiagnosticData>(() =>
    MicrophoneManager.getDiagnostics()
  );

  useEffect(() => {
    const unsub = MicrophoneManager.subscribeDiagnostics((d) => {
      setDiagnosticData({ ...d });
    });
    return () => unsub();
  }, []);

  // Active transient subtitle for clean display & auto-fadeout
  const [activeSubtitle, setActiveSubtitle] = useState<{
    userText: string;
    ariaText: string;
    visible: boolean;
  }>({
    userText: "",
    ariaText: "",
    visible: false,
  });

  const subtitleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showSubtitle = useCallback((userText?: string, ariaText?: string) => {
    if (subtitleTimerRef.current) {
      clearTimeout(subtitleTimerRef.current);
      subtitleTimerRef.current = null;
    }
    setActiveSubtitle((prev) => ({
      userText: userText !== undefined ? userText : prev.userText,
      ariaText: ariaText !== undefined ? ariaText : prev.ariaText,
      visible: true,
    }));
  }, []);

  const scheduleHideSubtitle = useCallback((delayMs: number = 5000) => {
    if (subtitleTimerRef.current) {
      clearTimeout(subtitleTimerRef.current);
    }
    subtitleTimerRef.current = setTimeout(() => {
      setActiveSubtitle((prev) => ({ ...prev, visible: false }));
    }, delayMs);
  }, []);

  useEffect(() => {
    return () => {
      if (subtitleTimerRef.current) {
        clearTimeout(subtitleTimerRef.current);
      }
    };
  }, []);

  const liveSessionRef = useRef<LiveSessionManager | null>(null);
  const wakeWordServiceRef = useRef<WakeWordService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, appState]);

  // AUTHORITATIVE SINGLETON MICROPHONE & CONTINUOUS WAKE ENGINE SETUP
  useEffect(() => {
    MicrophoneManager.setCallbacks(
      (query, rawTranscript) => {
        console.log("[App] Exact wake word triggered:", rawTranscript);
        handleTriggeredVoiceInput(query, rawTranscript);
      },
      (text, isInterim) => {
        if (!isInterim) {
          console.log("[App] Background speech heard:", text);
        }
      }
    );

    if (systemSettings.wakeWordEnabled && !isSessionActive) {
      MicrophoneManager.startWakeEngine(true);
    } else {
      MicrophoneManager.stopWakeEngine();
    }

    return () => {
      // Keep pipeline stable
    };
  }, [systemSettings.wakeWordEnabled, isSessionActive]);

  // Suspend wake listening when assistant is active, resume on idle
  useEffect(() => {
    if (appState !== "idle" || isSessionActive) {
      MicrophoneManager.suspendWakeEngine();
    } else if (systemSettings.wakeWordEnabled) {
      MicrophoneManager.resumeWakeEngine();
    }
  }, [appState, isSessionActive, systemSettings.wakeWordEnabled]);

  // START LIVE VOICE SESSION
  const startLiveVoiceSession = async () => {
    if (isSessionActive) return;
    try {
      const stream = await MicrophoneManager.getOrCreateMediaStream(true);
      if (!stream) {
        setShowPermissionModal(true);
        setIsSessionActive(false);
        setAppState("idle");
        return;
      }

      setIsSessionActive(true);
      resetAriaSession();

      const session = new LiveSessionManager(userName);
      session.isMuted = isMuted;
      liveSessionRef.current = session;

      session.onStateChange = (state) => {
        setAppState(state);
        if (state === "idle") {
          scheduleHideSubtitle(4000);
        }
      };

      session.onMessage = (sender, text) => {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString() + "-" + sender, sender, text },
        ]);
        if (sender === "user") {
          showSubtitle(text, "");
        } else {
          showSubtitle(undefined, text);
          scheduleHideSubtitle(5000);
        }
      };

      session.onCommand = (url) => {
        setTimeout(() => {
          try {
            window.open(url, "_blank");
          } catch (err) {
            console.warn("Could not open external URL:", err);
          }
        }, 1000);
      };

      await session.start();
    } catch (e) {
      console.error("[ERROR] Failed to start Live Voice session", e);
      setShowPermissionModal(true);
      setIsSessionActive(false);
      setAppState("idle");
    }
  };

  // STOP LIVE VOICE SESSION
  const stopLiveVoiceSession = () => {
    setIsSessionActive(false);
    if (liveSessionRef.current) {
      liveSessionRef.current.stop();
      liveSessionRef.current = null;
    }
    setAppState("idle");
    scheduleHideSubtitle(3000);
    resetAriaSession();
  };

  // Global user interaction listener to guarantee speech recognition starts in browsers
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (systemSettings.wakeWordEnabled && !isSessionActive && appState === "idle") {
        MicrophoneManager.startWakeEngine(true);
      }
    };
    window.addEventListener("click", handleFirstInteraction);
    window.addEventListener("touchstart", handleFirstInteraction);
    window.addEventListener("keydown", handleFirstInteraction);
    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [systemSettings.wakeWordEnabled, isSessionActive, appState]);

  const handleTriggeredVoiceInput = async (query: string, rawTranscript: string) => {
    if (isSessionActive) return;

    // Physical confirmation vibration
    triggerWakeWordHaptic();

    // Start the Live AI Voice Session immediately on hearing "हे एरा" or "एरा"
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString() + "-u", sender: "user", text: rawTranscript },
    ]);
    showSubtitle(rawTranscript, "हाँ, बोलिए... मैं सुन रही हूँ।");
    await startLiveVoiceSession();
  };

  // Handle Save Name
  const handleSaveName = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setUserName(trimmed);
    localStorage.setItem("aria_user_name", trimmed);
    setShowNameModal(false);

    if (messages.length === 0) {
      const currentLang = getCurrentLanguageItem();
      const greetingText =
        currentLang.code === "hi"
          ? `नमस्ते ${trimmed}! मैं हूँ Aria। हमेशा हिंदी में बात करने के लिए तैयार हूँ—बस बोलिए "हे आइरा" या "आइरा"।`
          : `Hello ${trimmed}! I am Aria (${currentLang.name}). Say "Hey Aiar" or "Aira" anytime.`;

      setMessages([{ id: Date.now().toString() + "-a", sender: "aria", text: greetingText }]);
      showSubtitle("", greetingText);

      if (!isMuted) {
        setAppState("speaking");
        const audioBase64 = await getAriaAudio(greetingText);
        if (audioBase64) {
          await playPCM(audioBase64);
        }
        setAppState("idle");
      }
      scheduleHideSubtitle(5000);
    }
  };

  // Handle Feature Hub Launcher
  const handleOpenFeature = (featureId: string) => {
    if (featureId === "camera") {
      setCameraMode("camera");
      setActiveModal("camera_gallery");
    } else if (featureId === "gallery") {
      setCameraMode("gallery");
      setActiveModal("camera_gallery");
    } else if (featureId === "permissions") {
      setActiveModal("permissions");
    } else if (featureId === "media") {
      setIsPlayingMedia(true);
    } else {
      setActiveModal(featureId);
    }
  };

  // UNIFIED COMMAND HANDLER ACROSS VOICE & TEXT
  const handleCommandExecution = useCallback(
    async (rawText: string) => {
      if (!rawText.trim()) {
        if (isSessionActive) {
          setAppState("listening");
        } else {
          setAppState("idle");
        }
        return;
      }

      setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "user", text: rawText }]);
      showSubtitle(rawText, "");

      if (isSessionActive && liveSessionRef.current) {
        liveSessionRef.current.sendText(rawText);
        return;
      }

      setAppState("processing");

      const result: CommandResult = processCommand(
        rawText,
        systemSettings,
        contacts,
        userName
      );

      if (result.systemUpdate) {
        setSystemSettings((prev) => ({ ...prev, ...result.systemUpdate }));
      }

      if (result.openModal) {
        if (result.openModal === "gallery") {
          setCameraMode("gallery");
          setActiveModal("camera_gallery");
        } else if (result.openModal === "camera") {
          setCameraMode("camera");
          setActiveModal("camera_gallery");
        } else {
          setActiveModal(result.openModal);
        }
      }

      if (result.callTarget) {
        setCallTarget(result.callTarget);
      }
      if (result.smsTarget) {
        setSmsTarget(result.smsTarget);
      }
      if (result.browserTarget) {
        setBrowserTarget(result.browserTarget);
      }
      if (result.securityPrompt) {
        setSecurityPrompt(result.securityPrompt);
      }

      let responseText = "";
      if (result.handled) {
        responseText = result.action;
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString() + "-a", sender: "aria", text: responseText },
        ]);
        showSubtitle(rawText, responseText);
      } else {
        const messageId = Date.now().toString() + "-a";
        let messageAdded = false;

        responseText = await getAriaResponse(
          rawText,
          messagesRef.current,
          userName,
          (streamedText) => {
            if (!messageAdded) {
              messageAdded = true;
              setMessages((prev) => [
                ...prev,
                { id: messageId, sender: "aria", text: streamedText },
              ]);
            } else {
              setMessages((prev) =>
                prev.map((msg) => (msg.id === messageId ? { ...msg, text: streamedText } : msg))
              );
            }
            showSubtitle(rawText, streamedText);
          }
        );

        if (!messageAdded) {
          setMessages((prev) => [
            ...prev,
            { id: messageId, sender: "aria", text: responseText },
          ]);
          showSubtitle(rawText, responseText);
        }
      }

      // 2. Play Gemini Neural HD Human Voice with high fidelity & natural emotion
      if (!isMuted) {
        setAppState("speaking");
        try {
          const audioBase64 = await getAriaAudio(responseText);
          if (audioBase64) {
            await playPCM(audioBase64);
          }
        } catch (err) {
          console.warn("Audio playback error:", err);
        }

        if (isSessionActive) {
          setAppState("listening");
        } else {
          setAppState("idle");
        }
      } else {
        if (isSessionActive) {
          setAppState("listening");
        } else {
          setAppState("idle");
        }
      }

      scheduleHideSubtitle(5000);

      if (result.isBrowserAction && result.url && !result.openModal) {
        setTimeout(() => {
          try {
            window.open(result.url, "_blank");
          } catch (err) {
            console.warn("Could not open browser action URL:", err);
          }
        }, 1200);
      }
    },
    [isMuted, isSessionActive, userName, systemSettings, contacts, showSubtitle, scheduleHideSubtitle]
  );

  const toggleListening = async () => {
    if (isSessionActive) {
      stopLiveVoiceSession();
    } else {
      await startLiveVoiceSession();
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    handleCommandExecution(textInput);
    setTextInput("");
  };

  const lastAriaMessage = [...messages]
    .reverse()
    .find((m) => m.sender === "aria" || m.sender === "zoya");
  const lastUserMessage = [...messages].reverse().find((m) => m.sender === "user");

  return (
    <div
      id="aria-clean-root"
      className="h-[100dvh] w-screen bg-[#060813] text-white flex flex-col items-center justify-between font-sans relative overflow-hidden m-0 p-0 select-none"
    >
      {/* Background Ambient Glows */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-cyan-600/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-violet-600/10 blur-[140px] rounded-full" />
      </div>

      {/* MODALS */}
      {showNameModal && (
        <NameModal
          initialName={userName}
          onSave={handleSaveName}
          onClose={userName ? () => setShowNameModal(false) : undefined}
        />
      )}

      {showPermissionModal && (
        <PermissionModal
          onClose={() => setShowPermissionModal(false)}
          onGranted={() => {
            setShowPermissionModal(false);
            if (!isSessionActive) {
              startLiveVoiceSession();
            }
          }}
        />
      )}

      {/* 1. Settings & API Key Modal */}
      <SettingsModal
        isOpen={activeModal === "settings"}
        onClose={() => setActiveModal(null)}
        settings={systemSettings}
        onUpdateSettings={(newSettings) => setSystemSettings((prev) => ({ ...prev, ...newSettings }))}
        userName={userName}
        onUpdateUserName={handleSaveName}
        onOpenFeature={handleOpenFeature}
      />

      {/* 2. All Installed Android Apps Drawer */}
      <PhoneAppsDrawer
        isOpen={activeModal === "apps"}
        onClose={() => setActiveModal(null)}
        onLaunchApp={(appId) => handleOpenFeature(appId)}
      />

      {/* 3. File Manager & Storage */}
      <FileManagerModal
        isOpen={activeModal === "files"}
        onClose={() => setActiveModal(null)}
      />

      {/* 4. Notification Center */}
      <NotificationCenter
        isOpen={activeModal === "notifications"}
        onClose={() => setActiveModal(null)}
        notifications={notifications}
        onDismiss={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
        onClearAll={() => setNotifications([])}
      />

      {/* 5. Android OS Native Architecture Bridge */}
      <ArchitectureModal
        isOpen={activeModal === "architecture"}
        onClose={() => setActiveModal(null)}
      />

      {/* 6. Android Permissions & Capabilities Section */}
      <AndroidPermissionsModal
        isOpen={activeModal === "permissions"}
        onClose={() => setActiveModal(null)}
      />

      <ContactsCallsModal
        isOpen={activeModal === "dialer"}
        onClose={() => {
          setActiveModal(null);
          setCallTarget(null);
        }}
        initialTarget={callTarget}
        contacts={contacts}
        onAddContact={(c) => setContacts((prev) => [c, ...prev])}
      />

      <MessagingModal
        isOpen={activeModal === "sms"}
        onClose={() => {
          setActiveModal(null);
          setSmsTarget(null);
        }}
        initialTarget={smsTarget}
        contacts={contacts}
      />

      <CameraGalleryModal
        isOpen={activeModal === "camera_gallery"}
        mode={cameraMode}
        onClose={() => setActiveModal(null)}
        onVisionAnalysis={(analysisText) => {
          setMessages((prev) => [
            ...prev,
            { id: Date.now().toString() + "-a", sender: "aria", text: analysisText },
          ]);
        }}
      />

      <MiniBrowserModal
        isOpen={activeModal === "browser"}
        onClose={() => {
          setActiveModal(null);
          setBrowserTarget(null);
        }}
        initialTarget={browserTarget}
      />

      <SecurityConfirmModal
        isOpen={!!securityPrompt}
        title={securityPrompt?.title || ""}
        risk={securityPrompt?.risk || ""}
        actionToPerform={securityPrompt?.actionToPerform || ""}
        onClose={() => setSecurityPrompt(null)}
      />

      {/* Voice Pipeline Diagnostic & Repair HUD */}
      <VoicePipelineDiagnosticModal
        isOpen={showDiagnosticModal}
        onClose={() => setShowDiagnosticModal(false)}
      />

      {/* 1. CLEAN TOP HEADER */}
      <header className="w-full max-w-3xl flex justify-between items-center z-20 shrink-0 px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowNameModal(true)}
            className="flex items-center gap-2.5 text-left group cursor-pointer hover:opacity-90 transition-all p-1 rounded-xl hover:bg-white/5"
            title="Click to change your name / अपना नाम बदलें"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-500 flex items-center justify-center font-bold text-xs shadow-md shadow-cyan-500/20 text-white">
              {userName ? userName.charAt(0).toUpperCase() : "A"}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-semibold tracking-wider text-white group-hover:text-cyan-300 transition-colors">AIRA</h1>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 font-mono border border-cyan-500/20">Voice AI</span>
              </div>
              <p className="text-[10px] text-cyan-400 font-mono tracking-tight flex items-center gap-1 hover:underline">
                <User size={10} className="text-cyan-400 shrink-0" />
                <span className="truncate max-w-[130px]">{userName ? userName : "Set Your Name"}</span>
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Change Name Button */}
          <button
            onClick={() => setShowNameModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-xs font-mono text-violet-300 border border-violet-500/30 transition-all cursor-pointer shadow-sm"
            title="Change User Name / अपना नाम बदलें"
          >
            <User size={13} className="text-violet-400" />
            <span className="font-medium">{userName ? userName.split(" ")[0] : "Set Name"}</span>
          </button>

          {/* Language Selector Button (Default: Hindi 🇮🇳) */}
          <button
            onClick={() => setActiveModal("settings")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-xs font-mono text-amber-300 border border-amber-500/30 transition-all cursor-pointer shadow-sm"
            title="Language Settings (Always Hindi Default & All Global Languages)"
          >
            <span className="text-xs">{getCurrentLanguageItem().flag}</span>
            <span className="hidden sm:inline font-bold">{getCurrentLanguageItem().nativeName}</span>
          </button>

          {/* Android Permissions & Capabilities Button */}
          <button
            onClick={() => setActiveModal("permissions")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-teal-500/20 text-xs font-mono text-teal-300 border border-white/10 transition-all cursor-pointer shadow-sm"
            title="Open Android Permissions & Capabilities"
          >
            <Shield size={13} className="text-teal-400" />
            <span className="hidden md:inline">Permissions</span>
          </button>

          {/* All Features Button */}
          <button
            onClick={() => setActiveModal("apps")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-xs font-mono text-cyan-300 border border-white/10 transition-all cursor-pointer shadow-sm"
            title="Open All Features & App Drawer"
          >
            <Grid size={13} className="text-cyan-400" />
            <span className="hidden sm:inline">Features</span>
          </button>

          {/* Voice Pipeline Diagnostic Button */}
          <button
            onClick={() => setShowDiagnosticModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer shadow-sm ${
              diagnosticData.wakeEngine === "LISTENING"
                ? "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                : diagnosticData.wakeEngine === "ERROR" || diagnosticData.micPermission === "DENIED"
                ? "bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/30"
                : "bg-white/5 hover:bg-white/10 text-white/70 border-white/10"
            }`}
            title="Open Voice Pipeline Diagnostic & Repair HUD"
          >
            <Activity size={13} className={diagnosticData.wakeEngine === "LISTENING" ? "text-cyan-400 animate-pulse" : "text-amber-400"} />
            <span className="hidden sm:inline">Diagnostics</span>
          </button>

          {/* Settings & API Key Button */}
          <button
            onClick={() => setActiveModal("settings")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-xs font-mono text-amber-300 border border-white/10 transition-all cursor-pointer shadow-sm"
            title="Open Settings & API Key Section"
          >
            <Settings size={13} className="text-amber-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {userName && (
            <button
              onClick={() => setShowNameModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-white/80 border border-white/10 transition-all cursor-pointer"
              title="Click to edit name"
            >
              <User size={12} className="text-cyan-400" />
              <span className="max-w-[70px] sm:max-w-[100px] truncate">{userName}</span>
            </button>
          )}

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/10 cursor-pointer"
            title={isMuted ? "Unmute Voice" : "Mute Voice"}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
      </header>

      {/* Media Player Bar (when active) */}
      {isPlayingMedia && (
        <div className="w-full max-w-xl px-4 z-30 mb-1">
          <MediaPlayerBar
            isPlaying={isPlayingMedia}
            onTogglePlay={() => setIsPlayingMedia(!isPlayingMedia)}
            onNextTrack={() => {}}
            onPrevTrack={() => {}}
            volume={systemSettings.volume}
          />
        </div>
      )}

      {/* 2. MAIN CENTER - VISUALIZER ORB & LIVE SPEECH */}
      <main className="flex-1 w-full max-w-3xl flex flex-col items-center justify-center relative overflow-hidden px-4 z-10">
        {/* Live Subtitle Transcript Banner (Auto-fades after message completion) */}
        <div className="w-full flex flex-col items-center gap-2 z-20 pointer-events-auto px-4 mb-auto pt-2 min-h-[80px]">
          <AnimatePresence mode="wait">
            {activeSubtitle.visible && (activeSubtitle.ariaText || activeSubtitle.userText) && (
              <motion.div
                key={activeSubtitle.ariaText || activeSubtitle.userText}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-col items-center gap-2 max-w-md w-full"
              >
                {/* Aria's Response bubble */}
                {activeSubtitle.ariaText && (
                  <div
                    onClick={() => setActiveSubtitle((prev) => ({ ...prev, visible: false }))}
                    className="w-full text-center bg-black/50 backdrop-blur-md border border-cyan-500/25 rounded-2xl px-5 py-3 shadow-2xl cursor-pointer hover:border-cyan-500/40 transition-colors"
                    title="Click to dismiss"
                  >
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-cyan-400 font-mono tracking-widest uppercase mb-1">
                      <Sparkles size={11} />
                      <span>Aira</span>
                    </div>
                    <p className="text-sm md:text-base font-medium text-white/95 leading-relaxed font-sans">
                      "{activeSubtitle.ariaText}"
                    </p>
                  </div>
                )}

                {/* User's Input text */}
                {activeSubtitle.userText && (
                  <div className="text-center text-xs text-white/50 italic font-mono flex items-center gap-1.5">
                    <span className="text-cyan-400/70">You:</span>
                    <span>"{activeSubtitle.userText}"</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Center Visualizer Hologram Orb */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <Visualizer state={appState} />
        </div>

        {/* State Status Badge */}
        <div className="z-10 mt-auto mb-3 flex items-center justify-center pointer-events-none">
          <AnimatePresence>
            {appState === "processing" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono"
              >
                <Loader2 size={13} className="animate-spin text-cyan-400" />
                <span>Processing response...</span>
              </motion.div>
            )}
            {appState === "listening" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-mono"
              >
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span>लाइव वॉइस चालू है... (बोलिए)</span>
              </motion.div>
            )}
            {appState === "idle" && systemSettings.wakeWordEnabled && (
              <motion.button
                onClick={() => setShowDiagnosticModal(true)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="pointer-events-auto flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/40 hover:bg-black/60 border border-white/15 text-white/80 text-[11px] font-mono cursor-pointer transition-all hover:border-cyan-500/40 shadow-sm"
                title="Click to view Voice Pipeline Diagnostics"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${diagnosticData.wakeEngine === "LISTENING" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                <span>
                  {diagnosticData.wakeEngine === "LISTENING"
                    ? 'कंटीन्यूअस मोड (बोलिए: "हे एरा" या "एरा")'
                    : `Wake Engine: ${diagnosticData.wakeEngine}`}
                </span>
                <span className="text-[10px] text-cyan-400/80 border-l border-white/10 pl-1.5">
                  Diag HUD
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* 3. MODERN CLEAN BOTTOM CONTROL DOCK: START SESSION PILL & CIRCULAR KEYBOARD BUTTON */}
      <footer className="w-full max-w-2xl flex flex-col items-center justify-center pb-6 pt-2 z-20 shrink-0 gap-3 px-4">
        <AnimatePresence mode="wait">
          {!showTextInput ? (
            <motion.div
              key="voice-dock"
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center gap-3 sm:gap-4"
            >
              {/* Pill Button: [ 🎙️ Start Session ] */}
              <button
                onClick={toggleListening}
                className={`
                  group relative flex items-center justify-center gap-3 h-13 sm:h-14 px-7 sm:px-9 rounded-full
                  transition-all duration-200 cursor-pointer select-none
                  backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] active:scale-[0.98]
                  ${
                    isSessionActive
                      ? "bg-[#2d1217] hover:bg-[#3d1820] border border-rose-500/40 text-white shadow-rose-900/20"
                      : "bg-[#222127]/90 hover:bg-[#2d2c34] border border-white/10 hover:border-white/20 text-white"
                  }
                `}
                title={isSessionActive ? "सेशन समाप्त करें (End Session)" : "सेशन शुरू करें (Start Session)"}
              >
                {/* Active Session Subtle Glow Indicator */}
                {isSessionActive && (
                  <span className="absolute -inset-0.5 rounded-full bg-rose-500/20 animate-pulse pointer-events-none" />
                )}

                <div className="relative flex items-center justify-center">
                  {isSessionActive ? (
                    <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
                  ) : (
                    <Mic className="w-5 h-5 text-white/90 group-hover:scale-110 transition-transform" />
                  )}
                </div>

                <span className="text-sm sm:text-base font-normal tracking-wide text-white/90 font-sans">
                  {isSessionActive ? "End Session" : "Start Session"}
                </span>

                {/* Animated Audio Bars when session is active */}
                {isSessionActive && (
                  <div className="flex items-center gap-0.5 ml-1 h-3.5">
                    <span className="w-0.5 bg-rose-400 rounded-full animate-[bounce_0.8s_ease-in-out_infinite_0.1s] h-2" />
                    <span className="w-0.5 bg-rose-400 rounded-full animate-[bounce_0.6s_ease-in-out_infinite_0.3s] h-3.5" />
                    <span className="w-0.5 bg-rose-400 rounded-full animate-[bounce_0.7s_ease-in-out_infinite_0.2s] h-2.5" />
                  </div>
                )}
              </button>

              {/* Circular Keyboard Button: [ ⌨️ ] */}
              <button
                onClick={() => {
                  setShowTextInput(true);
                  setTimeout(() => textInputRef.current?.focus(), 50);
                }}
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#222127]/90 hover:bg-[#2d2c34] border border-white/10 hover:border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all duration-200 cursor-pointer backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] active:scale-95"
                title="टाइप करके पूछें (Text Input Mode)"
              >
                <Keyboard className="w-5 h-5 sm:w-6 sm:h-6 text-white/80" />
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="text-input-dock"
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleTextSubmit}
              className="w-full max-w-lg flex items-center gap-2 h-13 sm:h-14 px-3 sm:px-4 rounded-full bg-[#222127]/95 border border-white/15 shadow-[0_10px_35px_rgba(0,0,0,0.7)] backdrop-blur-2xl transition-all"
            >
              {/* Switch back to Voice button */}
              <button
                type="button"
                onClick={() => setShowTextInput(false)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="वॉइस मोड पर लौटें (Switch to Voice)"
              >
                <Mic size={18} />
              </button>

              <input
                ref={textInputRef}
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={
                  getCurrentLanguageItem().code === "hi"
                    ? "मैसेज या कमांड लिखें..."
                    : `Ask or type in ${getCurrentLanguageItem().name}...`
                }
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/40 text-xs sm:text-sm font-sans px-1"
              />

              {textInput.trim() ? (
                <button
                  type="submit"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                  title="भेजें (Send)"
                >
                  <Send size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowTextInput(false)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-transparent hover:bg-white/10 text-white/40 hover:text-white/80 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="बंद करें (Close)"
                >
                  <X size={17} />
                </button>
              )}
            </motion.form>
          )}
        </AnimatePresence>

        {/* Small Sub-Hint Label */}
        <div className="flex items-center gap-2 text-[11px] text-white/40 font-mono tracking-tight">
          <span>🎤 Wake Word: <strong className="text-amber-400 font-semibold">"Era" / "एरा"</strong></span>
          <span>•</span>
          <span>⚡ Live Hindi & English</span>
        </div>
      </footer>
    </div>
  );
}
