import React from "react";
import { motion } from "motion/react";
import {
  Settings,
  X,
  Wifi,
  WifiOff,
  Bluetooth,
  Flashlight,
  Volume2,
  VolumeX,
  Volume1,
  Sun,
  Moon,
  Battery,
  BatteryCharging,
  Radio,
  RotateCw,
  Vibrate,
  Shield,
  Mic,
  Smartphone,
  Zap,
} from "lucide-react";
import { SystemSettings } from "../types/device";

interface SystemControlCenterProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => void;
}

export default function SystemControlCenter({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: SystemControlCenterProps) {
  if (!isOpen) return null;

  return (
    <div
      id="system-control-center-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        className="bg-[#0b101c] border border-cyan-500/30 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Settings size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">System Controls & Quick Settings</h2>
              <p className="text-[11px] text-white/50">Aria Hardware & Device Controller</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Controls Grid */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 1. BATTERY & STATUS CARD */}
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
                  {settings.batterySaver ? "Battery Saver Active" : "Normal Power Mode"}
                </p>
              </div>
            </div>

            <button
              onClick={() => onUpdateSettings({ batterySaver: !settings.batterySaver })}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                settings.batterySaver
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                  : "bg-white/5 border-white/10 text-white/60 hover:text-white"
              }`}
            >
              <Zap size={13} className="inline mr-1" />
              Saver
            </button>
          </div>

          {/* 2. QUICK SETTINGS TILES */}
          <div>
            <h4 className="text-xs font-mono text-white/60 uppercase tracking-wider mb-2.5">
              Quick Toggles
            </h4>
            <div className="grid grid-cols-4 gap-2.5">
              {/* Wi-Fi */}
              <button
                onClick={() => onUpdateSettings({ wifi: !settings.wifi })}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  settings.wifi
                    ? "bg-cyan-500 text-black border-cyan-400 font-semibold shadow-md shadow-cyan-500/20"
                    : "bg-white/5 hover:bg-white/10 text-white/70 border-white/5"
                }`}
              >
                <Wifi size={18} />
                <span className="text-[11px]">Wi-Fi</span>
              </button>

              {/* Bluetooth */}
              <button
                onClick={() => onUpdateSettings({ bluetooth: !settings.bluetooth })}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  settings.bluetooth
                    ? "bg-cyan-500 text-black border-cyan-400 font-semibold shadow-md shadow-cyan-500/20"
                    : "bg-white/5 hover:bg-white/10 text-white/70 border-white/5"
                }`}
              >
                <Bluetooth size={18} />
                <span className="text-[11px]">Bluetooth</span>
              </button>

              {/* Flashlight / Torch */}
              <button
                onClick={() => onUpdateSettings({ flashlight: !settings.flashlight })}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  settings.flashlight
                    ? "bg-amber-400 text-black border-amber-300 font-semibold shadow-md shadow-amber-400/30 animate-pulse"
                    : "bg-white/5 hover:bg-white/10 text-white/70 border-white/5"
                }`}
              >
                <Flashlight size={18} />
                <span className="text-[11px]">Torch</span>
              </button>

              {/* Mobile Data */}
              <button
                onClick={() => onUpdateSettings({ mobileData: !settings.mobileData })}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  settings.mobileData
                    ? "bg-cyan-500 text-black border-cyan-400 font-semibold shadow-md shadow-cyan-500/20"
                    : "bg-white/5 hover:bg-white/10 text-white/70 border-white/5"
                }`}
              >
                <Radio size={18} />
                <span className="text-[11px]">Data</span>
              </button>

              {/* DND (Do Not Disturb) */}
              <button
                onClick={() => onUpdateSettings({ dnd: !settings.dnd })}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  settings.dnd
                    ? "bg-purple-500 text-white border-purple-400 font-semibold shadow-md shadow-purple-500/20"
                    : "bg-white/5 hover:bg-white/10 text-white/70 border-white/5"
                }`}
              >
                <Moon size={18} />
                <span className="text-[11px]">DND</span>
              </button>

              {/* Auto Rotate */}
              <button
                onClick={() => onUpdateSettings({ autoRotate: !settings.autoRotate })}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  settings.autoRotate
                    ? "bg-cyan-500 text-black border-cyan-400 font-semibold shadow-md shadow-cyan-500/20"
                    : "bg-white/5 hover:bg-white/10 text-white/70 border-white/5"
                }`}
              >
                <RotateCw size={18} />
                <span className="text-[11px]">Rotate</span>
              </button>

              {/* Sound Mode */}
              <button
                onClick={() => {
                  const nextMode =
                    settings.soundMode === "sound"
                      ? "vibrate"
                      : settings.soundMode === "vibrate"
                      ? "silent"
                      : "sound";
                  onUpdateSettings({ soundMode: nextMode });
                }}
                className="p-3 rounded-xl border bg-white/5 hover:bg-white/10 text-white/70 border-white/5 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {settings.soundMode === "sound" ? (
                  <Volume2 size={18} className="text-emerald-400" />
                ) : settings.soundMode === "vibrate" ? (
                  <Vibrate size={18} className="text-amber-400" />
                ) : (
                  <VolumeX size={18} className="text-red-400" />
                )}
                <span className="text-[11px] capitalize">{settings.soundMode}</span>
              </button>

              {/* Hotspot */}
              <button
                onClick={() => onUpdateSettings({ hotspot: !settings.hotspot })}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  settings.hotspot
                    ? "bg-cyan-500 text-black border-cyan-400 font-semibold shadow-md shadow-cyan-500/20"
                    : "bg-white/5 hover:bg-white/10 text-white/70 border-white/5"
                }`}
              >
                <Smartphone size={18} />
                <span className="text-[11px]">Hotspot</span>
              </button>
            </div>
          </div>

          {/* 3. SLIDERS: VOLUME & BRIGHTNESS */}
          <div className="space-y-4 pt-2 border-t border-white/10">
            {/* Media Volume */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-white/80 font-medium flex items-center gap-1.5">
                  <Volume2 size={14} className="text-cyan-400" /> Media Volume
                </span>
                <span className="text-cyan-400 font-mono">{settings.volume}%</span>
              </div>
              <input
                id="media-volume-slider"
                type="range"
                min="0"
                max="100"
                value={settings.volume}
                onChange={(e) => onUpdateSettings({ volume: Number(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
              />
            </div>

            {/* Brightness */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-white/80 font-medium flex items-center gap-1.5">
                  <Sun size={14} className="text-amber-400" /> Screen Brightness
                </span>
                <span className="text-amber-400 font-mono">{settings.brightness}%</span>
              </div>
              <input
                id="screen-brightness-slider"
                type="range"
                min="10"
                max="100"
                value={settings.brightness}
                onChange={(e) => onUpdateSettings({ brightness: Number(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
              />
            </div>
          </div>

          {/* 4. WAKE WORD ENGINE SETTINGS */}
          <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Mic size={18} />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">Voice Wake Word ("Hey Aria")</h5>
                <p className="text-[11px] text-white/50">Continuous background voice listening</p>
              </div>
            </div>

            <button
              onClick={() => onUpdateSettings({ wakeWordEnabled: !settings.wakeWordEnabled })}
              className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${
                settings.wakeWordEnabled ? "bg-cyan-500" : "bg-white/20"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-all transform absolute top-0.5 ${
                  settings.wakeWordEnabled ? "left-6.5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
