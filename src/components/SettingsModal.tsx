import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Settings,
  X,
  Key,
  Cpu,
  Smartphone,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Zap,
  Volume2,
  VolumeX,
  Volume1,
  Sun,
  Moon,
  Battery,
  BatteryCharging,
  Wifi,
  WifiOff,
  Bluetooth,
  Flashlight,
  Shield,
  Phone,
  MessageCircle,
  Camera,
  Image as ImageIcon,
  Folder,
  Globe,
  Bell,
  Music,
  Layers,
  Sparkles,
  User,
  Radio,
  Play,
  RotateCcw,
  Languages,
  Search,
} from "lucide-react";
import { SystemSettings, Contact } from "../types/device";
import {
  getCustomApiKey,
  setCustomApiKey,
  testApiKeyConnection,
  getSelectedVoice,
  setSelectedVoice,
  getAriaAudio,
} from "../services/geminiService";
import {
  getWakeWordSensitivity,
  setWakeWordSensitivity,
  WakeWordSensitivity,
  checkTriggerPhrase,
} from "../services/wakeWordService";
import {
  SUPPORTED_LANGUAGES,
  getPrimaryLanguage,
  setPrimaryLanguage,
  LanguageItem,
} from "../services/languageService";
import { playPCM } from "../utils/audioUtils";
import {
  isHapticSupported,
  getHapticFeedbackEnabled,
  setHapticFeedbackEnabled,
  triggerWakeWordHaptic,
  triggerLightHaptic,
} from "../utils/hapticUtils";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => void;
  userName: string;
  onUpdateUserName: (name: string) => void;
  onOpenFeature: (featureId: string) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  userName,
  onUpdateUserName,
  onOpenFeature,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"languages" | "features" | "api_key" | "hardware" | "about">("languages");

  // Language State
  const [primaryLang, setPrimaryLangState] = useState<string>("hi");
  const [langSearch, setLangSearch] = useState<string>("");
  const [langCategory, setLangCategory] = useState<"all" | "indian" | "global" | "regional">("all");
  const [previewingLangCode, setPreviewingLangCode] = useState<string | null>(null);

  // API Key State
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });

  // Voice Selection State
  const [currentVoice, setCurrentVoice] = useState("Kore");
  const [isPlayingVoicePreview, setIsPlayingVoicePreview] = useState(false);

  // Wake Word Sensitivity & Test State
  const [sensitivity, setSensitivity] = useState<WakeWordSensitivity>("medium");
  const [wakeTestInput, setWakeTestInput] = useState("");
  const [wakeTestResult, setWakeTestResult] = useState<string | null>(null);
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(true);

  // User Name Input State
  const [nameInput, setNameInput] = useState(userName);
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPrimaryLangState(getPrimaryLanguage());
      setApiKeyInput(getCustomApiKey());
      setCurrentVoice(getSelectedVoice());
      setSensitivity(getWakeWordSensitivity());
      setHapticEnabled(getHapticFeedbackEnabled());
      setNameInput(userName);
      setTestStatus({ loading: false });
    }
  }, [isOpen, userName]);

  if (!isOpen) return null;

  const handleSelectLanguage = (code: string) => {
    setPrimaryLanguage(code);
    setPrimaryLangState(code);
  };

  const handlePreviewLanguageVoice = async (lang: LanguageItem) => {
    if (previewingLangCode) return;
    setPreviewingLangCode(lang.code);
    try {
      const audioBase64 = await getAriaAudio(lang.greetingText);
      if (audioBase64) {
        await playPCM(audioBase64);
      }
    } catch (e) {
      console.error("Language preview error", e);
    } finally {
      setPreviewingLangCode(null);
    }
  };

  const filteredLanguages = SUPPORTED_LANGUAGES.filter((lang) => {
    const matchesSearch =
      lang.name.toLowerCase().includes(langSearch.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(langSearch.toLowerCase()) ||
      lang.code.toLowerCase().includes(langSearch.toLowerCase());
    const matchesCat = langCategory === "all" || lang.category === langCategory;
    return matchesSearch && matchesCat;
  });

  const handleSaveApiKey = () => {
    setCustomApiKey(apiKeyInput);
    setTestStatus({
      loading: false,
      success: true,
      message: apiKeyInput.trim() ? "Custom API key saved successfully!" : "Reset to default environment key.",
    });
  };

  const handleTestApiKey = async () => {
    setTestStatus({ loading: true });
    const result = await testApiKeyConnection(apiKeyInput.trim() || undefined);
    setTestStatus({
      loading: false,
      success: result.success,
      message: result.message,
    });
  };

  const handleVoiceChange = (voice: string) => {
    setCurrentVoice(voice);
    setSelectedVoice(voice);
  };

  const handlePreviewVoice = async () => {
    if (isPlayingVoicePreview) return;
    setIsPlayingVoicePreview(true);
    try {
      const audioBase64 = await getAriaAudio("Hello! I am ready to assist you.");
      if (audioBase64) {
        await playPCM(audioBase64);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPlayingVoicePreview(false);
    }
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onUpdateUserName(nameInput.trim());
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    }
  };

  const ALL_FEATURES = [
    { id: "dialer", title: "Phone & Calls", desc: "Dial numbers & contact list", icon: Phone, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { id: "sms", title: "Messages & WhatsApp", desc: "SMS and chat messaging", icon: MessageCircle, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
    { id: "camera", title: "Camera & AI Vision", desc: "Real-time object & OCR scanner", icon: Camera, color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
    { id: "gallery", title: "Gallery & Photos", desc: "Captured photos & visual intelligence", icon: ImageIcon, color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
    { id: "files", title: "Files & Storage", desc: "Manage documents & archives", icon: Folder, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
    { id: "browser", title: "Mini Browser", desc: "Web search & URL navigation", icon: Globe, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    { id: "notifications", title: "Notification Shade", desc: "System alerts & quick actions", icon: Bell, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    { id: "apps", title: "All Apps Drawer", desc: "View all 16+ installed Android apps", icon: Smartphone, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
    { id: "architecture", title: "Android OS Bridge", desc: "AccessibilityService & Intent scripts", icon: Layers, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
    { id: "permissions", title: "Android Permissions & Capabilities", desc: "All 22 permission mappings, special access & security boundaries", icon: Shield, color: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
  ];

  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className="bg-[#0b101c] border border-cyan-500/30 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Settings size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-wide">Settings & Features Hub</h2>
              <p className="text-[11px] text-cyan-400/80 font-mono">API Key, Device Controls & All Android Features</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 border-b border-white/10 bg-white/[0.02] overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveTab("languages")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "languages"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-sm shadow-amber-500/10"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Languages size={13} />
            <span>Languages & Hindi ({SUPPORTED_LANGUAGES.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("api_key")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "api_key"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Key size={13} />
            <span>API Key & Engine</span>
          </button>

          <button
            onClick={() => setActiveTab("features")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "features"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Sparkles size={13} />
            <span>All Features ({ALL_FEATURES.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("hardware")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "hardware"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Smartphone size={13} />
            <span>Device Controls</span>
          </button>

          <button
            onClick={() => setActiveTab("about")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "about"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <User size={13} />
            <span>Profile & Info</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB 0: ALL LANGUAGES & HINDI PRIORITY */}
          {activeTab === "languages" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Top Banner highlighting Hindi Default */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-amber-500/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">
                    🇮🇳
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">Always Speak Hindi (Default)</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                        ACTIVE PRIMARY
                      </span>
                    </div>
                    <p className="text-xs text-white/70">
                      Aria responds in natural, witty, sassy Hindi by default, and supports all {SUPPORTED_LANGUAGES.length}+ global & Indian languages.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectLanguage("hi")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    primaryLang === "hi"
                      ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  }`}
                >
                  {primaryLang === "hi" ? <Check size={14} /> : null}
                  <span>{primaryLang === "hi" ? "Hindi Selected" : "Reset to Hindi"}</span>
                </button>
              </div>

              {/* Search & Category Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    placeholder="Search languages (Hindi, Bengali, Tamil, Spanish, Japanese...)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex gap-1 overflow-x-auto text-[11px] font-mono p-1 bg-white/5 rounded-xl border border-white/10">
                  {[
                    { id: "all", label: `All (${SUPPORTED_LANGUAGES.length})` },
                    { id: "indian", label: "Indian (14)" },
                    { id: "global", label: "Global (12)" },
                    { id: "regional", label: "Regional" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setLangCategory(cat.id as any)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        langCategory === cat.id
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredLanguages.map((lang) => {
                  const isSelected = primaryLang === lang.code;
                  const isPreviewing = previewingLangCode === lang.code;

                  return (
                    <div
                      key={lang.code}
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                        isSelected
                          ? "bg-amber-500/15 border-amber-500/50 text-white shadow-md shadow-amber-500/10"
                          : "bg-white/5 border-white/10 hover:border-white/25 text-white/80 hover:bg-white/[0.07]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl shrink-0">{lang.flag}</span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-white">{lang.name}</h4>
                              <span className="text-[10px] text-white/50 font-mono">({lang.nativeName})</span>
                            </div>
                            <span className="text-[10px] text-cyan-300/80 font-mono">
                              Speech Tag: {lang.speechCode}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-black font-mono font-bold shrink-0 flex items-center gap-1">
                            <Check size={11} /> Primary
                          </span>
                        )}
                      </div>

                      {/* Sample prompt & Live Preview */}
                      <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 text-[11px]">
                        <p className="text-white/60 truncate font-mono text-[10.5px]">
                          "{lang.samplePrompt}"
                        </p>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewLanguageVoice(lang);
                          }}
                          disabled={isPreviewing}
                          className="px-2 py-1 rounded bg-white/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 text-[10px] font-mono transition-colors flex items-center gap-1 shrink-0 cursor-pointer border border-white/10"
                          title="Listen to Aria speaking in this language"
                        >
                          <Play size={10} className={isPreviewing ? "animate-pulse" : ""} />
                          <span>{isPreviewing ? "Speaking..." : "Listen"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 1: API KEY & AI ENGINE */}
          {activeTab === "api_key" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* API Key Box */}
              <div className="p-4 rounded-xl bg-white/5 border border-cyan-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key size={16} className="text-cyan-400" />
                    <h4 className="text-sm font-semibold text-white">Gemini API Key Configuration</h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    AI Studio Connected
                  </span>
                </div>

                <p className="text-xs text-white/60 leading-relaxed">
                  By default, Aria uses the securely injected server-side environment Gemini API key. You can also supply a custom API key for direct overrides.
                </p>

                <div className="space-y-2">
                  <div className="relative flex items-center">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="Enter custom Gemini API Key (or leave blank to use default)..."
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 pr-10 text-xs font-mono text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 text-white/40 hover:text-white transition-colors cursor-pointer"
                    >
                      {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={handleSaveApiKey}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
                    >
                      <Check size={13} />
                      <span>Save Key</span>
                    </button>

                    <button
                      onClick={handleTestApiKey}
                      disabled={testStatus.loading}
                      className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-white/10 disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={testStatus.loading ? "animate-spin text-cyan-400" : ""} />
                      <span>{testStatus.loading ? "Testing..." : "Test Connection"}</span>
                    </button>

                    {apiKeyInput && (
                      <button
                        onClick={() => {
                          setApiKeyInput("");
                          setCustomApiKey("");
                          setTestStatus({ loading: false, success: true, message: "Reset to default key." });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs transition-colors cursor-pointer border border-red-500/20"
                      >
                        Clear Custom Key
                      </button>
                    )}
                  </div>

                  {testStatus.message && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-xs p-2.5 rounded-lg flex items-center gap-2 font-mono ${
                        testStatus.success
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                          : "bg-red-500/10 border border-red-500/20 text-red-300"
                      }`}
                    >
                      {testStatus.success ? <Check size={14} /> : <AlertCircle size={14} />}
                      <span>{testStatus.message}</span>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* AI Model & Speed Engine */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <Cpu size={16} className="text-violet-400" />
                  <h4 className="text-sm font-semibold text-white">Model & Engine Configuration</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-black/40 border border-white/10 flex flex-col gap-1">
                    <span className="text-white/50 text-[10px] font-mono uppercase">Primary Intelligence</span>
                    <span className="text-white font-medium flex items-center justify-between">
                      <span>gemini-3.7-flash</span>
                      <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">Active</span>
                    </span>
                    <span className="text-[10px] text-white/40">Ultra-fast multimodal reasoning</span>
                  </div>

                  <div className="p-3 rounded-lg bg-black/40 border border-white/10 flex flex-col gap-1">
                    <span className="text-white/50 text-[10px] font-mono uppercase">Thinking Level</span>
                    <span className="text-white font-medium flex items-center justify-between">
                      <span>ThinkingLevel.LOW</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">0-Latency</span>
                    </span>
                    <span className="text-[10px] text-white/40">Sub-second snappy response time</span>
                  </div>
                </div>
              </div>

              {/* Voice & TTS Settings */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 size={16} className="text-pink-400" />
                    <h4 className="text-sm font-semibold text-white">Voice & Audio Synthesis (TTS)</h4>
                  </div>
                  <button
                    onClick={handlePreviewVoice}
                    disabled={isPlayingVoicePreview}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-xs font-mono transition-colors cursor-pointer border border-pink-500/30"
                  >
                    <Play size={11} className={isPlayingVoicePreview ? "animate-pulse" : ""} />
                    <span>{isPlayingVoicePreview ? "Playing..." : "Test Voice"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: "Kore", label: "Kore (Default)", desc: "Clear & Natural" },
                    { id: "Puck", label: "Puck", desc: "Warm & Expressive" },
                    { id: "Fenrir", label: "Fenrir", desc: "Deep & Crisp" },
                    { id: "Aoede", label: "Aoede", desc: "Smooth & Melodic" },
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleVoiceChange(v.id)}
                      className={`p-2.5 rounded-lg border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                        currentVoice === v.id
                          ? "bg-pink-500/20 border-pink-500/50 text-white shadow-md shadow-pink-500/10"
                          : "bg-black/30 border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="font-semibold text-xs">{v.label}</span>
                      <span className="text-[10px] text-white/40">{v.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALL ANDROID FEATURES HUB */}
          {activeTab === "features" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Android AI OS Features Hub</h3>
                  <p className="text-xs text-white/50">Click any module to launch directly</p>
                </div>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  {ALL_FEATURES.length} Modules Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ALL_FEATURES.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={f.id}
                      onClick={() => {
                        onClose();
                        onOpenFeature(f.id);
                      }}
                      className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer flex items-center gap-3.5 group shadow-sm hover:shadow-cyan-500/10"
                    >
                      <div className={`p-2.5 rounded-xl border ${f.color} transition-transform group-hover:scale-105`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">
                          {f.title}
                        </h4>
                        <p className="text-[11px] text-white/50 truncate">{f.desc}</p>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400/80 opacity-0 group-hover:opacity-100 transition-opacity">
                        Launch →
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: HARDWARE & DEVICE CONTROLS */}
          {activeTab === "hardware" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Battery Status */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                    {settings.isCharging ? (
                      <BatteryCharging className="w-6 h-6 animate-pulse" />
                    ) : (
                      <Battery className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Battery {settings.batteryLevel}%</span>
                      {settings.isCharging && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                          CHARGING
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-white/50 font-mono">
                      {settings.batterySaver ? "Battery Saver Active" : "Standard Power Profile"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onUpdateSettings({ batterySaver: !settings.batterySaver })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    settings.batterySaver
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  {settings.batterySaver ? "Saver ON" : "Saver OFF"}
                </button>
              </div>

              {/* Hardware Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Wi-Fi */}
                <button
                  onClick={() => onUpdateSettings({ wifi: !settings.wifi })}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                    settings.wifi
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                      : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                  }`}
                >
                  {settings.wifi ? <Wifi size={20} /> : <WifiOff size={20} />}
                  <span className="text-xs font-semibold">Wi-Fi</span>
                  <span className="text-[10px] font-mono">{settings.wifi ? "Connected" : "Off"}</span>
                </button>

                {/* Bluetooth */}
                <button
                  onClick={() => onUpdateSettings({ bluetooth: !settings.bluetooth })}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                    settings.bluetooth
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                      : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                  }`}
                >
                  <Bluetooth size={20} />
                  <span className="text-xs font-semibold">Bluetooth</span>
                  <span className="text-[10px] font-mono">{settings.bluetooth ? "Paired" : "Off"}</span>
                </button>

                {/* Flashlight */}
                <button
                  onClick={() => onUpdateSettings({ flashlight: !settings.flashlight })}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                    settings.flashlight
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-lg shadow-amber-500/10"
                      : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                  }`}
                >
                  <Flashlight size={20} className={settings.flashlight ? "animate-bounce" : ""} />
                  <span className="text-xs font-semibold">Flashlight</span>
                  <span className="text-[10px] font-mono">{settings.flashlight ? "Torch ON" : "Off"}</span>
                </button>

                {/* Wake Word Mode */}
                <button
                  onClick={() => onUpdateSettings({ wakeWordEnabled: !settings.wakeWordEnabled })}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                    settings.wakeWordEnabled
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                      : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                  }`}
                >
                  <Radio size={20} />
                  <span className="text-xs font-semibold">Wake Word</span>
                  <span className="text-[10px] font-mono">{settings.wakeWordEnabled ? "Active" : "Disabled"}</span>
                </button>
              </div>

              {/* Sliders: Volume & Brightness */}
              <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
                {/* Volume */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-white/70 flex items-center gap-1.5">
                      <Volume2 size={14} className="text-cyan-400" />
                      Media Volume
                    </span>
                    <span className="text-cyan-400">{settings.volume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.volume}
                    onChange={(e) => onUpdateSettings({ volume: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Brightness */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-white/70 flex items-center gap-1.5">
                      <Sun size={14} className="text-amber-400" />
                      Screen Brightness
                    </span>
                    <span className="text-amber-400">{settings.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={settings.brightness}
                    onChange={(e) => onUpdateSettings({ brightness: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>
              </div>

              {/* Wake Word Engine Tuning & Sensitivity */}
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio size={16} className="text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Wake Word Engine & Sensitivity</h4>
                      <p className="text-[10px] text-white/50 font-mono">
                        Recognizes "Hey Aiar", "Aira", "Hey Aria" with accent adaptation
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                      settings.wakeWordEnabled
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-white/5 text-white/40"
                    }`}
                  >
                    {settings.wakeWordEnabled ? "LISTENING" : "PAUSED"}
                  </span>
                </div>

                {/* Sensitivity Selector */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-white/70 font-mono">Detection Sensitivity:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(["low", "medium", "high"] as WakeWordSensitivity[]).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => {
                          setSensitivity(level);
                          setWakeWordSensitivity(level);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-xs font-mono capitalize transition-all cursor-pointer border ${
                          sensitivity === level
                            ? "bg-cyan-500/30 border-cyan-400 text-cyan-200 font-bold shadow-sm shadow-cyan-500/20"
                            : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        {level} {level === "medium" && "(Default)"}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-cyan-300/70 font-mono">
                    Strict exact wake-words: "Hey AIAR" or "AIAR". Rejects loose partial matches like "Hey AI", "AI", or "Hey".
                  </p>
                </div>

                {/* Live Trigger Test Input */}
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  <label className="text-[11px] text-white/70 font-mono block">
                    Test phrase trigger matching:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={wakeTestInput}
                      onChange={(e) => setWakeTestInput(e.target.value)}
                      placeholder='e.g. "Hey AIAR turn on flashlight" or "AIAR what is the time"'
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const res = checkTriggerPhrase(wakeTestInput, sensitivity);
                        if (res.isTriggered) {
                          triggerWakeWordHaptic();
                          setWakeTestResult(
                            `Triggered & Haptic Buzz! Word: "${res.wakeWordMatched}" | Query: "${res.query || "(wake only)"}" (Confidence: ${Math.round(res.confidence * 100)}%)`
                          );
                        } else {
                          setWakeTestResult(`Not Triggered (Must start with "Hey AIAR" or "AIAR")`);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono transition-colors cursor-pointer"
                    >
                      Test
                    </button>
                  </div>
                  {wakeTestResult && (
                    <div
                      className={`text-[11px] font-mono p-2 rounded-lg ${
                        wakeTestResult.startsWith("Triggered")
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {wakeTestResult}
                    </div>
                  )}
                </div>

                {/* Haptic Feedback Physical Confirmation */}
                <div className="pt-2.5 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className={hapticEnabled ? "text-amber-400" : "text-white/40"} />
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Wake Word Haptic Vibration
                      </span>
                      <span className="text-[10px] text-white/50 font-mono">
                        {isHapticSupported()
                          ? "Dual-pulse vibration physical feedback on wake word trigger"
                          : "Haptic vibration supported on mobile & modern Android browsers"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        triggerWakeWordHaptic();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 border border-white/10 text-[11px] font-mono transition-colors cursor-pointer"
                      title="Test physical vibration pulse"
                    >
                      Test Buzz
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const next = !hapticEnabled;
                        setHapticEnabled(next);
                        setHapticFeedbackEnabled(next);
                        if (next) triggerWakeWordHaptic();
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                        hapticEnabled
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-white/5 text-white/40 border border-white/10"
                      }`}
                    >
                      {hapticEnabled ? "Haptics ON" : "Haptics OFF"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE & ABOUT */}
          {activeTab === "about" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* User Name Editor */}
              <form onSubmit={handleSaveName} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-cyan-400" />
                    <h4 className="text-sm font-semibold text-white">User Profile & Name</h4>
                  </div>
                  {userName && (
                    <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded">
                      Active: {userName}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter your name (e.g. Satyam Sahani)..."
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                  {userName && (
                    <button
                      type="button"
                      onClick={() => {
                        setNameInput("");
                        onUpdateUserName("");
                        setNameSaved(true);
                        setTimeout(() => setNameSaved(false), 2000);
                      }}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-red-300 border border-white/10 text-xs transition-colors cursor-pointer"
                      title="Clear / Remove Name"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {nameSaved && (
                  <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                    <Check size={12} /> Name updated successfully!
                  </span>
                )}
              </form>

              {/* Developer & Assistant Identity */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2.5 text-xs text-white/70">
                <h4 className="text-sm font-semibold text-white">System Information</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-white/40 block">ASSISTANT</span>
                    <span className="text-white font-bold">Aira (एरा) AI</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-white/40 block">CREATOR & DEVELOPER</span>
                    <span className="text-cyan-300 font-bold">Satyam Sahani</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-white/40 block">TRIGGER WORDS</span>
                    <span className="text-emerald-300 font-bold">"Hey Aira" / "Aira" / "एरा"</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-white/40 block">ARCHITECTURE</span>
                    <span className="text-violet-300 font-bold">Native Android OS Bridge</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-white/5 flex items-center justify-between text-xs">
          <span className="text-white/40 font-mono text-[11px]">Aira v2.5 • Satyam Sahani</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
