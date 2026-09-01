import React from "react";
import { motion, AnimatePresence } from "motion/react";

type VisualizerState = "idle" | "listening" | "processing" | "speaking";

interface VisualizerProps {
  state: VisualizerState;
}

export default function Visualizer({ state }: VisualizerProps) {
  // Theme styling depending on current AI state
  const getTheme = () => {
    switch (state) {
      case "listening":
        return {
          primary: "#8b5cf6",
          secondary: "#a78bfa",
          glow: "rgba(139, 92, 246, 0.45)",
          ambient: "rgba(124, 58, 237, 0.2)",
          ringBorder: "rgba(167, 139, 250, 0.6)",
          statusText: "LISTENING",
          pulseSpeed: 1.2,
          spinSpeed: 8,
          coreGrad: "from-violet-600/40 via-purple-900/50 to-black/80",
        };
      case "processing":
        return {
          primary: "#06b6d4",
          secondary: "#38bdf8",
          glow: "rgba(6, 182, 212, 0.55)",
          ambient: "rgba(14, 165, 233, 0.25)",
          ringBorder: "rgba(56, 189, 248, 0.7)",
          statusText: "COMPUTING",
          pulseSpeed: 0.8,
          spinSpeed: 3,
          coreGrad: "from-cyan-600/40 via-sky-950/60 to-black/80",
        };
      case "speaking":
        return {
          primary: "#ec4899",
          secondary: "#f43f5e",
          glow: "rgba(236, 72, 153, 0.55)",
          ambient: "rgba(244, 63, 94, 0.25)",
          ringBorder: "rgba(251, 113, 133, 0.7)",
          statusText: "SPEAKING",
          pulseSpeed: 0.6,
          spinSpeed: 5,
          coreGrad: "from-pink-600/40 via-rose-950/60 to-black/80",
        };
      default:
        return {
          primary: "#00f0ff",
          secondary: "#3b82f6",
          glow: "rgba(0, 240, 255, 0.35)",
          ambient: "rgba(59, 130, 246, 0.15)",
          ringBorder: "rgba(0, 240, 255, 0.4)",
          statusText: "READY",
          pulseSpeed: 3.5,
          spinSpeed: 20,
          coreGrad: "from-cyan-900/30 via-slate-950/70 to-black/90",
        };
    }
  };

  const theme = getTheme();

  // Audio wave / equalizer bar heights simulation
  const eqBars = Array.from({ length: 32 }, (_, i) => i);

  return (
    <div className="relative flex items-center justify-center w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] md:w-[520px] md:h-[520px] pointer-events-none select-none">
      {/* 1. Deep Ambient Radial Atmosphere Glow */}
      <motion.div
        animate={{
          scale: state === "speaking" ? [1, 1.18, 0.95, 1.1, 1] : state === "listening" ? [1, 1.1, 1] : [1, 1.05, 1],
          opacity: state === "speaking" ? [0.6, 0.9, 0.6] : [0.35, 0.55, 0.35],
        }}
        transition={{
          duration: theme.pulseSpeed,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 rounded-full blur-[90px]"
        style={{ backgroundColor: theme.glow }}
      />

      {/* 2. Outer Cybernetic Ring with Coordinate Ticks */}
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: theme.spinSpeed * 2.5, repeat: Infinity, ease: "linear" }}
        className="absolute inset-2 sm:inset-4 rounded-full border border-dashed opacity-40"
        style={{ borderColor: theme.secondary }}
      >
        {/* Orbital Marker Satellites */}
        <div
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full blur-[1px]"
          style={{ backgroundColor: theme.primary, boxShadow: `0 0 12px ${theme.primary}` }}
        />
        <div
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full opacity-70"
          style={{ backgroundColor: theme.secondary, boxShadow: `0 0 8px ${theme.secondary}` }}
        />
      </motion.div>

      {/* 3. High-Tech SVG Orbital HUD Layout */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity="0.8" />
            <stop offset="50%" stopColor={theme.secondary} stopOpacity="0.3" />
            <stop offset="100%" stopColor={theme.primary} stopOpacity="0.9" />
          </linearGradient>
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>

        {/* Outer segmented HUD Arcs */}
        <motion.g
          animate={{ rotate: [360, 0] }}
          transition={{ duration: theme.spinSpeed * 1.8, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "250px 250px" }}
        >
          <circle
            cx="250"
            cy="250"
            r="230"
            stroke="url(#cyberGrad)"
            strokeWidth="1.5"
            strokeDasharray="20 40 80 40 10 30"
            strokeOpacity="0.6"
          />
          <circle
            cx="250"
            cy="250"
            r="215"
            stroke={theme.primary}
            strokeWidth="1"
            strokeDasharray="4 8"
            strokeOpacity="0.35"
          />
          {/* Angular Corner Accents */}
          <path d="M 250 20 L 260 30" stroke={theme.primary} strokeWidth="2" />
          <path d="M 250 480 L 240 470" stroke={theme.primary} strokeWidth="2" />
          <path d="M 20 250 L 30 260" stroke={theme.primary} strokeWidth="2" />
          <path d="M 480 250 L 470 240" stroke={theme.primary} strokeWidth="2" />
        </motion.g>

        {/* Middle Counter-Rotating Gyroscopic Ring */}
        <motion.g
          animate={{ rotate: [0, 360] }}
          transition={{ duration: theme.spinSpeed * 1.2, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "250px 250px" }}
        >
          <circle
            cx="250"
            cy="250"
            r="185"
            stroke={theme.secondary}
            strokeWidth="2"
            strokeDasharray="60 30 10 30"
            filter="url(#neonGlow)"
            strokeOpacity="0.8"
          />
          <circle
            cx="250"
            cy="250"
            r="165"
            stroke={theme.primary}
            strokeWidth="1"
            strokeDasharray="2 12"
            strokeOpacity="0.5"
          />
        </motion.g>

        {/* Audio Spectrum Radial Rays */}
        <g style={{ transformOrigin: "250px 250px" }}>
          {eqBars.map((bar, i) => {
            const angle = (i * 360) / eqBars.length;
            const rad = (angle * Math.PI) / 180;
            const innerR = 125;
            const dynamicLen =
              state === "speaking"
                ? 12 + Math.sin(i * 1.5 + Date.now() / 100) * 18 + (i % 3 === 0 ? 10 : 0)
                : state === "listening"
                ? 8 + Math.cos(i * 2) * 8
                : state === "processing"
                ? 6 + ((i % 4) * 5)
                : 4 + (i % 2 === 0 ? 3 : 0);

            const x1 = 250 + innerR * Math.cos(rad);
            const y1 = 250 + innerR * Math.sin(rad);
            const x2 = 250 + (innerR + dynamicLen) * Math.cos(rad);
            const y2 = 250 + (innerR + dynamicLen) * Math.sin(rad);

            return (
              <motion.line
                key={bar}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={i % 2 === 0 ? theme.primary : theme.secondary}
                strokeWidth={state === "speaking" ? "2.5" : "1.5"}
                strokeLinecap="round"
                opacity={state === "idle" ? 0.4 : 0.85}
                animate={{
                  opacity: state === "speaking" ? [0.4, 1, 0.4] : [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 0.4 + (i % 5) * 0.1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            );
          })}
        </g>
      </svg>

      {/* 4. Rotating Energy Particles Field */}
      <motion.div
        animate={{ rotate: [-180, 180] }}
        transition={{ duration: theme.spinSpeed * 1.5, repeat: Infinity, ease: "linear" }}
        className="absolute w-[62%] h-[62%] rounded-full border border-dashed opacity-50"
        style={{ borderColor: theme.primary }}
      >
        <span
          className="absolute top-0 left-1/4 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: "#ffffff", boxShadow: `0 0 10px ${theme.primary}` }}
        />
        <span
          className="absolute bottom-4 right-1/4 w-2 h-2 rounded-full"
          style={{ backgroundColor: theme.secondary, boxShadow: `0 0 12px ${theme.secondary}` }}
        />
      </motion.div>

      {/* 5. Center AI Holographic Core Orb */}
      <motion.div
        animate={{
          scale:
            state === "speaking"
              ? [1, 1.08, 0.96, 1.04, 1]
              : state === "listening"
              ? [1, 1.04, 1]
              : state === "processing"
              ? [0.97, 1.03, 0.97]
              : [1, 1.02, 1],
        }}
        transition={{
          duration: theme.pulseSpeed,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`relative w-[44%] h-[44%] rounded-full bg-gradient-to-b ${theme.coreGrad} backdrop-blur-xl border flex flex-col items-center justify-center shadow-2xl transition-colors duration-500`}
        style={{
          borderColor: theme.ringBorder,
          boxShadow: `0 0 35px ${theme.ambient}, inset 0 0 25px ${theme.glow}`,
        }}
      >
        {/* Core Animated Ripple Rings */}
        <motion.div
          animate={{
            scale: [0.85, 1.25, 0.85],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: theme.pulseSpeed * 1.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-2 rounded-full border border-dashed opacity-40 pointer-events-none"
          style={{ borderColor: theme.primary }}
        />

        {/* Center Hologram Grid Pattern */}
        <div
          className="absolute inset-0 rounded-full opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]"
        />

        {/* Core Identity Display */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <motion.div
            animate={{
              opacity: [0.85, 1, 0.85],
              textShadow: [
                `0 0 12px ${theme.primary}`,
                `0 0 24px ${theme.primary}, 0 0 40px ${theme.secondary}`,
                `0 0 12px ${theme.primary}`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-[0.25em] text-white font-sans pl-1"
          >
            AIRA
          </motion.div>

          {/* Dynamic Status Badge */}
          <div className="flex items-center gap-1.5 mt-1 sm:mt-1.5">
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: theme.primary, boxShadow: `0 0 6px ${theme.primary}` }}
            />
            <span
              className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.2em] opacity-80 uppercase"
              style={{ color: theme.secondary }}
            >
              {theme.statusText}
            </span>
          </div>
        </div>

        {/* Mini Waveform Visualizer in Core */}
        <div className="absolute bottom-4 sm:bottom-6 flex items-center justify-center gap-1 h-3">
          {[0, 1, 2, 3, 4].map((bar) => (
            <motion.div
              key={bar}
              className="w-0.5 rounded-full"
              style={{ backgroundColor: theme.primary }}
              animate={{
                height:
                  state === "speaking"
                    ? ["3px", "14px", "4px", "12px", "3px"]
                    : state === "listening"
                    ? ["2px", "8px", "3px"]
                    : state === "processing"
                    ? ["2px", "6px", "2px"]
                    : ["2px", "4px", "2px"],
              }}
              transition={{
                duration: 0.4 + bar * 0.1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
