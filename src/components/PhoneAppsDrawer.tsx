import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Search,
  MessageCircle,
  Phone,
  Camera,
  Image as ImageIcon,
  Settings,
  Folder,
  Globe,
  Youtube,
  Music,
  Bell,
  Sparkles,
  Play,
  RotateCcw,
  Shield,
  Layers,
  Compass,
  Calculator,
  Mail,
  MapPin,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";
import { AppItem } from "../types/device";

interface PhoneAppsDrawerProps {
  isOpen: boolean;
  isRecentsMode?: boolean;
  onClose: () => void;
  onLaunchApp: (appId: string, name: string) => void;
}

export const INSTALLED_APPS: AppItem[] = [
  { id: "dialer", name: "Phone", category: "system", iconName: "phone", description: "Make calls & view contacts" },
  { id: "sms", name: "Messages", category: "social", iconName: "message", description: "SMS & WhatsApp chats", badgeCount: 2 },
  { id: "camera", name: "Camera", category: "media", iconName: "camera", description: "AI Vision & Photo Capture" },
  { id: "gallery", name: "Gallery", category: "media", iconName: "image", description: "Photo & video collection" },
  { id: "settings", name: "Settings", category: "system", iconName: "settings", description: "Quick controls, Volume & Wi-Fi" },
  { id: "files", name: "Files", category: "productivity", iconName: "folder", description: "Storage & Documents" },
  { id: "browser", name: "Chrome Browser", category: "productivity", iconName: "globe", description: "Web search & navigation" },
  { id: "youtube", name: "YouTube", category: "media", iconName: "youtube", description: "Stream music & videos", url: "https://www.youtube.com" },
  { id: "spotify", name: "Spotify Music", category: "media", iconName: "music", description: "Play Hindi & Global hits" },
  { id: "notifications", name: "Notifications", category: "system", iconName: "bell", description: "Notification shade & alerts", badgeCount: 4 },
  { id: "maps", name: "Google Maps", category: "tools", iconName: "map", description: "Navigation & live traffic", url: "https://maps.google.com" },
  { id: "gmail", name: "Gmail", category: "productivity", iconName: "mail", description: "Inbox & Email compose", url: "https://mail.google.com" },
  { id: "calculator", name: "Calculator", category: "tools", iconName: "calculator", description: "Math & quick equations" },
  { id: "calendar", name: "Calendar", category: "tools", iconName: "calendar", description: "Events & schedules" },
  { id: "clock", name: "Clock & Alarms", category: "tools", iconName: "clock", description: "Timer, stopwatch & alarms" },
  { id: "architecture", name: "Android Bridge", category: "system", iconName: "layers", description: "AccessibilityService & Intents code" },
];

export default function PhoneAppsDrawer({
  isOpen,
  isRecentsMode = false,
  onClose,
  onLaunchApp,
}: PhoneAppsDrawerProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [recentAppList, setRecentAppList] = useState<AppItem[]>([
    INSTALLED_APPS[0], // Phone
    INSTALLED_APPS[1], // Messages
    INSTALLED_APPS[2], // Camera
    INSTALLED_APPS[4], // Settings
    INSTALLED_APPS[7], // YouTube
  ]);

  if (!isOpen) return null;

  const filteredApps = INSTALLED_APPS.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === "all" || app.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const getIcon = (iconName: string) => {
    const props = { size: 24, className: "text-white" };
    switch (iconName) {
      case "phone":
        return <Phone {...props} className="text-emerald-400" />;
      case "message":
        return <MessageCircle {...props} className="text-cyan-400" />;
      case "camera":
        return <Camera {...props} className="text-violet-400" />;
      case "image":
        return <ImageIcon {...props} className="text-pink-400" />;
      case "settings":
        return <Settings {...props} className="text-amber-400" />;
      case "folder":
        return <Folder {...props} className="text-yellow-400" />;
      case "globe":
        return <Globe {...props} className="text-blue-400" />;
      case "youtube":
        return <Youtube {...props} className="text-red-500" />;
      case "music":
        return <Music {...props} className="text-green-400" />;
      case "bell":
        return <Bell {...props} className="text-orange-400" />;
      case "calculator":
        return <Calculator {...props} className="text-indigo-400" />;
      case "mail":
        return <Mail {...props} className="text-rose-400" />;
      case "map":
        return <MapPin {...props} className="text-teal-400" />;
      case "calendar":
        return <Calendar {...props} className="text-purple-400" />;
      case "clock":
        return <Clock {...props} className="text-sky-400" />;
      case "layers":
        return <Layers {...props} className="text-violet-400" />;
      default:
        return <Sparkles {...props} className="text-cyan-400" />;
    }
  };

  const handleClearRecents = () => {
    setRecentAppList([]);
  };

  return (
    <div
      id="phone-apps-drawer-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        className="bg-[#0c101c] border border-cyan-500/30 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              {isRecentsMode ? <RotateCcw size={18} /> : <Layers size={18} />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {isRecentsMode ? "Recent Apps Overview" : "Installed Applications"}
              </h2>
              <p className="text-xs text-white/50">
                {isRecentsMode
                  ? "Switch between running tasks or clear all"
                  : "Say 'Open [App]' or tap to launch"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isRecentsMode && recentAppList.length > 0 && (
              <button
                onClick={handleClearRecents}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-mono border border-red-500/30 transition-all cursor-pointer"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search & Category Filter (for App Drawer mode) */}
        {!isRecentsMode && (
          <div className="p-4 border-b border-white/10 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="apps-search-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search phone apps (e.g. Camera, WhatsApp, Settings)..."
                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400 transition-all"
              />
            </div>

            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {["all", "system", "social", "media", "productivity", "tools"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-cyan-500 text-black font-semibold shadow-md shadow-cyan-500/20"
                      : "bg-white/5 hover:bg-white/10 text-white/70"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Apps Grid Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isRecentsMode ? (
            recentAppList.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No recent applications running</p>
                <p className="text-xs text-white/30 mt-1">All background tasks cleared</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentAppList.map((app) => (
                  <motion.div
                    key={app.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between relative group cursor-pointer"
                    onClick={() => {
                      onLaunchApp(app.id, app.name);
                      onClose();
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shadow-inner">
                          {getIcon(app.iconName)}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">{app.name}</h4>
                          <span className="text-[11px] text-white/40 font-mono">Active in memory</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                        RUNNING
                      </span>
                    </div>

                    <p className="text-xs text-white/60 mb-3 line-clamp-1">{app.description}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-cyan-400 group-hover:text-cyan-300">
                      <span>Switch to App</span>
                      <Play size={12} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-4">
              {filteredApps.map((app) => (
                <motion.button
                  key={app.id}
                  id={`app-tile-${app.id}`}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    onLaunchApp(app.id, app.name);
                    onClose();
                  }}
                  className="flex flex-col items-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 transition-all text-center group relative cursor-pointer"
                >
                  {/* Badge */}
                  {app.badgeCount && app.badgeCount > 0 && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                      {app.badgeCount}
                    </span>
                  )}

                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-black/60 to-white/5 border border-white/10 flex items-center justify-center mb-2 shadow-lg group-hover:shadow-cyan-500/20 transition-all">
                    {getIcon(app.iconName)}
                  </div>
                  <span className="text-xs font-medium text-white/90 group-hover:text-white line-clamp-1">
                    {app.name}
                  </span>
                  <span className="text-[10px] text-white/40 font-mono capitalize">
                    {app.category}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-5 py-3 border-t border-white/10 bg-white/5 flex items-center justify-between text-xs text-white/40 font-mono">
          <span>Aria OS Navigation: Back, Home, Recents</span>
          <span className="text-cyan-400">Total: {INSTALLED_APPS.length} Apps</span>
        </div>
      </motion.div>
    </div>
  );
}
