import React, { useState, useEffect } from "react";
import {
  MicrophoneManager,
  VoiceDiagnosticData,
  checkExactAIARTrigger,
  normalizeTranscriptForAIAR,
} from "../services/microphoneManager";
import {
  Activity,
  Mic,
  MicOff,
  Radio,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Play,
  RotateCw,
  Terminal,
  Cpu,
  Layers,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VoicePipelineDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSessionManually?: () => void;
}

export default function VoicePipelineDiagnosticModal({
  isOpen,
  onClose,
  onStartSessionManually,
}: VoicePipelineDiagnosticModalProps) {
  const [diag, setDiag] = useState<VoiceDiagnosticData>(() =>
    MicrophoneManager.getDiagnostics()
  );
  const [testResultMsg, setTestResultMsg] = useState<string | null>(null);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [manualWakeTestInput, setManualWakeTestInput] = useState("");
  const [manualWakeResult, setManualWakeResult] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = MicrophoneManager.subscribeDiagnostics((data) => {
      setDiag({ ...data });
    });
    return () => unsubscribe();
  }, []);

  const handleTestMicrophone = async () => {
    setIsTestingMic(true);
    setTestResultMsg("Requesting microphone permission & starting speech listener...");
    const res = await MicrophoneManager.runMicrophoneDiagnosticTest();
    setIsTestingMic(false);
    setTestResultMsg(res.message);
  };

  const handleTestAIARStatus = () => {
    const current = MicrophoneManager.getDiagnostics();
    setTestResultMsg(
      `[STATUS CHECK] Mic: ${current.micStream} | Wake Engine: ${current.wakeEngine} | Last Transcript: "${current.lastTranscript}" | Wake Match: ${current.wakeMatch} | AI Session: ${current.aiSession}`
    );
  };

  const handleVerifyWakePhrase = () => {
    if (!manualWakeTestInput.trim()) {
      setManualWakeResult("Please enter test speech text.");
      return;
    }
    const normalized = normalizeTranscriptForAIAR(manualWakeTestInput);
    const result = checkExactAIARTrigger(manualWakeTestInput);
    if (result.isTriggered) {
      setManualWakeResult(
        `✅ EXACT MATCH TRIGGERED: "${result.wakeWordMatched}" | Normalized: "${normalized}" | Query: "${result.query || "(wake only)"}"`
      );
    } else {
      setManualWakeResult(
        `❌ REJECTED: "${manualWakeTestInput}" (Normalized: "${normalized}"). Wake words must be exactly "Hey AIAR" or "AIAR".`
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-[#090d1a] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-cyan-950/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Activity size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">
                AIAR Voice Pipeline Diagnostic & Repair HUD
              </h2>
              <p className="text-[11px] text-cyan-400/80 font-mono">
                Hardware Audio, Web Speech & Gemini Live Telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Diagnostic Metrics Matrix */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Top Status Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            {/* 1. MIC PERMISSION */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] text-white/50 uppercase tracking-wider">
                MIC PERMISSION
              </span>
              <div className="flex items-center gap-1.5 mt-1 font-bold">
                {diag.micPermission === "GRANTED" ? (
                  <CheckCircle2 size={14} className="text-emerald-400" />
                ) : diag.micPermission === "DENIED" ? (
                  <XCircle size={14} className="text-red-400" />
                ) : (
                  <HelpCircle size={14} className="text-amber-400" />
                )}
                <span
                  className={
                    diag.micPermission === "GRANTED"
                      ? "text-emerald-400"
                      : diag.micPermission === "DENIED"
                      ? "text-red-400"
                      : "text-amber-300"
                  }
                >
                  {diag.micPermission}
                </span>
              </div>
            </div>

            {/* 2. MIC STREAM */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] text-white/50 uppercase tracking-wider">
                MIC STREAM
              </span>
              <div className="flex items-center gap-1.5 mt-1 font-bold">
                <div
                  className={`w-2 h-2 rounded-full ${
                    diag.micStream === "ACTIVE"
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-red-500"
                  }`}
                />
                <span
                  className={
                    diag.micStream === "ACTIVE" ? "text-emerald-400" : "text-red-400"
                  }
                >
                  {diag.micStream}
                </span>
              </div>
            </div>

            {/* 3. WAKE ENGINE */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] text-white/50 uppercase tracking-wider">
                WAKE ENGINE
              </span>
              <div className="flex items-center gap-1.5 mt-1 font-bold">
                <Radio
                  size={14}
                  className={
                    diag.wakeEngine === "LISTENING"
                      ? "text-cyan-400 animate-pulse"
                      : diag.wakeEngine === "ERROR"
                      ? "text-red-400"
                      : "text-amber-400"
                  }
                />
                <span
                  className={
                    diag.wakeEngine === "LISTENING"
                      ? "text-cyan-400"
                      : diag.wakeEngine === "ERROR"
                      ? "text-red-400"
                      : "text-amber-300"
                  }
                >
                  {diag.wakeEngine}
                </span>
              </div>
            </div>

            {/* 4. AI SESSION */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] text-white/50 uppercase tracking-wider">
                AI SESSION
              </span>
              <div className="flex items-center gap-1.5 mt-1 font-bold">
                <Sparkles
                  size={14}
                  className={
                    diag.aiSession === "CONNECTED"
                      ? "text-violet-400 animate-bounce"
                      : diag.aiSession === "ERROR"
                      ? "text-red-400"
                      : "text-white/40"
                  }
                />
                <span
                  className={
                    diag.aiSession === "CONNECTED"
                      ? "text-violet-400"
                      : diag.aiSession === "ERROR"
                      ? "text-red-400"
                      : "text-white/60"
                  }
                >
                  {diag.aiSession}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Recognition Output */}
          <div className="bg-black/50 border border-cyan-500/20 rounded-xl p-4 space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
              <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
                <Terminal size={14} />
                LIVE SPEECH INPUT STREAM
              </span>
              <span className="text-[11px] text-white/50">
                Target: <strong className="text-cyan-400">"हे एरा"</strong> /{" "}
                <strong className="text-cyan-400">"एरा"</strong> /{" "}
                <strong className="text-cyan-400">"Hey AIAR"</strong> /{" "}
                <strong className="text-cyan-400">"AIAR"</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-white/40 text-[10px] uppercase">
                  LAST TRANSCRIPT:
                </span>
                <p className="text-white bg-black/40 p-2.5 rounded-lg border border-white/10 mt-1 min-h-[42px] break-words">
                  {diag.lastTranscript || "(listening for speech...)"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-white/40 text-[10px] uppercase">
                    CONFIDENCE:
                  </span>
                  <p className="text-cyan-300 font-bold bg-black/40 p-2.5 rounded-lg border border-white/10 mt-1 min-h-[42px] flex items-center justify-center">
                    {diag.lastConfidence !== null
                      ? `${Math.round(diag.lastConfidence * 100)}%`
                      : "N/A"}
                  </p>
                </div>

                <div>
                  <span className="text-white/40 text-[10px] uppercase">
                    WAKE MATCH:
                  </span>
                  <p
                    className={`font-bold p-2.5 rounded-lg border border-white/10 mt-1 min-h-[42px] flex items-center justify-center ${
                      diag.wakeMatch === "YES"
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                        : "text-white/50 bg-black/40"
                    }`}
                  >
                    {diag.wakeMatch}
                  </p>
                </div>
              </div>
            </div>

            {/* Pipeline Step State Machine Indicator */}
            <div className="pt-2">
              <span className="text-white/40 text-[10px] uppercase block mb-1">
                PIPELINE STATE MACHINE:
              </span>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                {[
                  "APP_STARTED",
                  "MIC_INITIALIZING",
                  "MIC_ACTIVE",
                  "WAKE_LISTENING",
                  "AIAR_DETECTED",
                  "AI_SESSION_CONNECTING",
                  "ASSISTANT_ACTIVE",
                  "SESSION_ENDED",
                ].map((step) => {
                  const isActive = diag.pipelineState === step;
                  return (
                    <span
                      key={step}
                      className={`px-2 py-0.5 rounded border transition-all ${
                        isActive
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold shadow-sm shadow-cyan-500/20"
                          : "bg-white/5 text-white/40 border-white/5"
                      }`}
                    >
                      {step}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Error Display */}
            {diag.lastError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-xs text-red-300 flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span className="break-all font-mono">
                  <strong>LAST ERROR:</strong> {diag.lastError}
                </span>
              </div>
            )}
          </div>

          {/* Test Buttons Section */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider block">
              Developer Pipeline Verification Tools
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={handleTestMicrophone}
                disabled={isTestingMic}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono transition-all cursor-pointer shadow-sm"
              >
                <Mic size={14} />
                <span>
                  {isTestingMic ? "Initializing Mic..." : "TEST MICROPHONE"}
                </span>
              </button>

              <button
                onClick={handleTestAIARStatus}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono transition-all cursor-pointer shadow-sm"
              >
                <Activity size={14} />
                <span>TEST AIAR STATUS</span>
              </button>
            </div>

            {testResultMsg && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs font-mono text-cyan-200">
                {testResultMsg}
              </div>
            )}
          </div>

          {/* Exact Wake Word Simulator / Normalization Validator */}
          <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-2.5">
            <span className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
              <Cpu size={14} className="text-violet-400" />
              Wake-Word Matcher & Normalization Validator
            </span>
            <p className="text-[11px] text-white/50 font-mono">
              Test exact wake string evaluation (e.g. "hey aiar turn on light", "aiar call satyam", "hey ai", "aiar").
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={manualWakeTestInput}
                onChange={(e) => setManualWakeTestInput(e.target.value)}
                placeholder='उदा: "हे एरा" / "एरा" / "Hey AIAR" / "AIAR"'
                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                onClick={handleVerifyWakePhrase}
                className="px-4 py-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/40 text-xs font-mono transition-colors cursor-pointer"
              >
                Validate
              </button>
            </div>

            {manualWakeResult && (
              <div className="text-xs font-mono p-2.5 bg-black/60 rounded-lg border border-white/10 text-white/90">
                {manualWakeResult}
              </div>
            )}
          </div>

          {/* System & Runtime Environment Info */}
          <div className="text-[11px] font-mono text-white/40 flex flex-wrap gap-4 pt-1 border-t border-white/5">
            <span>Runtime: {diag.runtimeEnvironment}</span>
            <span>Lang: {diag.activeLanguage}</span>
            <span>Cycles: {diag.restartCount}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-black/40">
          <span className="text-[11px] font-mono text-white/50">
            Console logs enabled: [MIC], [WAKE], [TRANSCRIPT], [SESSION], [AUDIO], [ERROR]
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition-colors cursor-pointer"
          >
            Close HUD
          </button>
        </div>
      </motion.div>
    </div>
  );
}
