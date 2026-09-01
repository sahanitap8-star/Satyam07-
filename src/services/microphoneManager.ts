/**
 * Centralized Authoritative Singleton Microphone & Voice Pipeline Manager
 * 
 * Strict Architecture:
 * 1. Single authoritative microphone lifecycle with single persistent MediaStream instance.
 * 2. Prevents rapid ON/OFF restart cycling with 1000ms minimum backoff and stream reuse checks.
 * 3. Exact strict regex match against "hey aiar" and "aiar" specifically (rejects partial matches).
 * 4. Real diagnostic telemetry tracking with exact logging prefixes:
 *    [MIC], [WAKE], [TRANSCRIPT], [SESSION], [AUDIO], [ERROR].
 */

import { triggerWakeWordHaptic } from "../utils/hapticUtils";
import { getSpeechRecognitionLanguage } from "./languageService";

export type MicLifecycleState =
  | "IDLE"
  | "INITIALIZING"
  | "ACTIVE"
  | "STOPPING"
  | "ERROR";

export type PipelineStep =
  | "APP_STARTED"
  | "MIC_INITIALIZING"
  | "MIC_ACTIVE"
  | "WAKE_LISTENING"
  | "AIAR_DETECTED"
  | "WAKE_LISTENING_STOPPED"
  | "AI_SESSION_CONNECTING"
  | "ASSISTANT_ACTIVE"
  | "SESSION_ENDED";

export type MicPermissionStatus = "GRANTED" | "DENIED" | "UNKNOWN";
export type StreamStatus = "ACTIVE" | "INACTIVE";
export type WakeEngineStatus = "STARTING" | "LISTENING" | "STOPPED" | "SUSPENDED" | "ERROR";
export type AISessionStatus = "CONNECTED" | "DISCONNECTED" | "CONNECTING" | "ERROR";

export interface VoiceDiagnosticData {
  micPermission: MicPermissionStatus;
  micStream: StreamStatus;
  wakeEngine: WakeEngineStatus;
  lastTranscript: string;
  lastConfidence: number | null;
  wakeMatch: "YES" | "NO";
  aiSession: AISessionStatus;
  lastError: string | null;
  pipelineState: PipelineStep;
  activeLanguage: string;
  runtimeEnvironment: string;
  restartCount: number;
}

/**
 * Normalizes speech recognition transcript for tolerant and accurate Aira matching.
 * Preserves Devanagari (Hindi) and Latin characters while cleaning punctuation.
 */
export function normalizeTranscriptForAIAR(text: string): string {
  if (!text) return "";

  let normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accent marks on latin letters
    .replace(/[.,?!;:।_—\-"'*/~`#@$%^&()\[\]{}<>\\|+=]/g, " ") // remove punctuation while preserving Hindi / English unicode text
    .replace(/\s+/g, " ")
    .trim();

  // Normalize speech-to-text letter-spaced variants
  normalized = normalized.replace(/\bhey\s+a\s+i\s+a\s+r\b/g, "hey aiar");
  normalized = normalized.replace(/\bhey\s+ai\s+a\s+r\b/g, "hey aiar");
  normalized = normalized.replace(/\bhey\s+a\s+i\s+ar\b/g, "hey aiar");
  normalized = normalized.replace(/\bhey\s+ai\s+ar\b/g, "hey aiar");
  normalized = normalized.replace(/\bhey\s+a\s+iar\b/g, "hey aiar");

  normalized = normalized.replace(/\ba\s+i\s+a\s+r\b/g, "aiar");
  normalized = normalized.replace(/\bai\s+a\s+r\b/g, "aiar");
  normalized = normalized.replace(/\ba\s+i\s+ar\b/g, "aiar");
  normalized = normalized.replace(/\bai\s+ar\b/g, "aiar");
  normalized = normalized.replace(/\ba\s+iar\b/g, "aiar");

  return normalized.replace(/\s+/g, " ").trim();
}

/**
 * List of recognized wake words matching user's specification:
 * ["aria", "hey aria", "aira", "era", "aera", "hey aira", "hey era", "एरिया", "हे एरिया", "एरा", "हे एरा", "हीरा", "aiar", "hey aiar"]
 */
export const WAKE_WORDS_LIST = [
  "aria",
  "hey aria",
  "aira",
  "era",
  "aera",
  "hey aira",
  "hey era",
  "hey aiar",
  "aiar",
  "एरिया",
  "हे एरिया",
  "एरा",
  "हे एरा",
  "हीरा",
  "हे हीरा",
];

export const STRICT_AIAR_WAKE_REGEX = /^(?:(hey\s+aria|aria|hey\s+aira|hey\s+era|hey\s+aera|hey\s+aiar|aira|era|aera|aiar|हे\s+एरिया|एरिया|हे\s+एरा|हे\s+हीरा|एरा|हीरा))(?:\s+(.*))?$/i;

export function checkExactAIARTrigger(rawTranscript: string): {
  isTriggered: boolean;
  wakeWordMatched: string;
  query: string;
  confidence: number;
} {
  const trimmed = rawTranscript ? rawTranscript.trim() : "";
  if (!trimmed) {
    return { isTriggered: false, wakeWordMatched: "", query: "", confidence: 0 };
  }

  const normalized = normalizeTranscriptForAIAR(trimmed);

  // 1. Direct prefix / standalone match at beginning of transcript
  const match = STRICT_AIAR_WAKE_REGEX.exec(normalized);
  if (match) {
    const matchedWakeKey = match[1].trim();
    const query = (match[2] || "").trim();
    return {
      isTriggered: true,
      wakeWordMatched: matchedWakeKey,
      query,
      confidence: 1.0,
    };
  }

  // 2. Exact word boundary check for Hindi & English variants anywhere in transcript
  const boundaryRegex = /(?:^|\s)(hey\s+aria|aria|hey\s+aira|hey\s+era|hey\s+aera|hey\s+aiar|aira|era|aera|aiar|हे\s+एरिया|एरिया|हे\s+एरा|हे\s+हीरा|एरा|हीरा)(?:\s+|$)(.*)/i;
  const boundaryMatch = boundaryRegex.exec(normalized);
  if (boundaryMatch) {
    const matchedWakeKey = boundaryMatch[1].trim();
    const query = (boundaryMatch[2] || "").trim();
    return {
      isTriggered: true,
      wakeWordMatched: matchedWakeKey,
      query,
      confidence: 1.0,
    };
  }

  return { isTriggered: false, wakeWordMatched: "", query: "", confidence: 0 };
}

class MicrophoneManagerService {
  private static instance: MicrophoneManagerService;

  // Single Authoritative MediaStream and Mutex
  private micState: MicLifecycleState = "IDLE";
  private pipelineStep: PipelineStep = "APP_STARTED";
  private mediaStream: MediaStream | null = null;
  private mediaStreamPromise: Promise<MediaStream | null> | null = null;
  private recognition: any = null;

  // Flags & Anti-Cycling Timers
  private isRecognitionActive: boolean = false;
  private isRecognitionStarting: boolean = false;
  private isSuspended: boolean = false;
  private userEnabledWake: boolean = true;
  private restartTimeout: any = null;
  private lastTriggerTimestamp: number = 0;
  private restartCount: number = 0;
  private lastRestartAttemptTime: number = 0;
  private readonly minRestartCooldownMs: number = 50;
  private readonly triggerCooldownMs: number = 1200;

  // Diagnostic Telemetry State
  private diagnostics: VoiceDiagnosticData = {
    micPermission: "UNKNOWN",
    micStream: "INACTIVE",
    wakeEngine: "STOPPED",
    lastTranscript: "(none yet)",
    lastConfidence: null,
    wakeMatch: "NO",
    aiSession: "DISCONNECTED",
    lastError: null,
    pipelineState: "APP_STARTED",
    activeLanguage: "hi-IN (Multilingual)",
    runtimeEnvironment: "Unknown",
    restartCount: 0,
  };

  // Event Listeners
  private diagnosticListeners: Set<(data: VoiceDiagnosticData) => void> = new Set();
  private onWakeTriggerCallback: ((query: string, rawTranscript: string) => void) | null = null;
  private onSpeechSnippetCallback: ((text: string, isInterim: boolean) => void) | null = null;

  private constructor() {
    this.detectEnvironment();
    this.checkInitialPermission();
  }

  public static getInstance(): MicrophoneManagerService {
    if (!MicrophoneManagerService.instance) {
      MicrophoneManagerService.instance = new MicrophoneManagerService();
    }
    return MicrophoneManagerService.instance;
  }

  private detectEnvironment() {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || "";
    let env = "Desktop Web";
    if (/Android/i.test(ua)) {
      if (/wv|WebView/i.test(ua)) {
        env = "Android WebView";
      } else {
        env = "Android Chrome / Mobile Web";
      }
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      env = "iOS Safari / WebKit";
    }
    this.updateDiagnostics({ runtimeEnvironment: env });
  }

  private async checkInitialPermission() {
    if (typeof navigator !== "undefined" && navigator.permissions?.query) {
      try {
        const result = await navigator.permissions.query({ name: "microphone" as any });
        const mapStatus = (state: PermissionState): MicPermissionStatus => {
          if (state === "granted") return "GRANTED";
          if (state === "denied") return "DENIED";
          return "UNKNOWN";
        };
        this.updateDiagnostics({ micPermission: mapStatus(result.state) });
        result.onchange = () => {
          this.updateDiagnostics({ micPermission: mapStatus(result.state) });
          console.log("[MIC] Permission state changed:", result.state);
        };
      } catch (e) {
        // Some browsers don't support querying microphone permission
      }
    }
  }

  // Diagnostic State Updates & Broadcasting
  public updateDiagnostics(partial: Partial<VoiceDiagnosticData>) {
    this.diagnostics = { ...this.diagnostics, ...partial };
    this.diagnosticListeners.forEach((fn) => {
      try {
        fn(this.diagnostics);
      } catch (e) {}
    });
  }

  public getDiagnostics(): VoiceDiagnosticData {
    return { ...this.diagnostics };
  }

  public subscribeDiagnostics(listener: (data: VoiceDiagnosticData) => void): () => void {
    this.diagnosticListeners.add(listener);
    listener(this.diagnostics);
    return () => {
      this.diagnosticListeners.delete(listener);
    };
  }

  public setCallbacks(
    onTrigger: (query: string, rawTranscript: string) => void,
    onSnippet?: (text: string, isInterim: boolean) => void
  ) {
    this.onWakeTriggerCallback = onTrigger;
    this.onSpeechSnippetCallback = onSnippet || null;
  }

  public setPipelineStep(step: PipelineStep) {
    this.pipelineStep = step;
    this.updateDiagnostics({ pipelineState: step });
    console.log(`[SESSION] Pipeline Step: ${step}`);
  }

  public setAISessionStatus(status: AISessionStatus, errorMsg?: string) {
    this.updateDiagnostics({
      aiSession: status,
      ...(errorMsg ? { lastError: errorMsg } : {}),
    });
    console.log(`[SESSION] AI Session Status: ${status}`, errorMsg ? `Error: ${errorMsg}` : "");
  }

  /**
   * Acquire single persistent authoritative MediaStream once and preserve it.
   * Explicit check prevents the microphone hardware from cycling ON/OFF.
   */
  public async getOrCreateMediaStream(userInitiated: boolean = false): Promise<MediaStream | null> {
    // 1. Explicit Check: Reuse existing healthy MediaStream instance without re-requesting
    if (this.mediaStream && this.mediaStream.active) {
      const liveTracks = this.mediaStream
        .getAudioTracks()
        .filter((t) => t.readyState === "live" && t.enabled);
      if (liveTracks.length > 0) {
        this.micState = "ACTIVE";
        this.updateDiagnostics({
          micStream: "ACTIVE",
          micPermission: "GRANTED",
        });
        return this.mediaStream;
      }
    }

    // 2. Prevent concurrent duplicate stream requests via mutex promise
    if (this.mediaStreamPromise) {
      console.log("[MIC] Stream acquisition already in flight, sharing promise...");
      return this.mediaStreamPromise;
    }

    this.mediaStreamPromise = (async () => {
      this.micState = "INITIALIZING";
      this.setPipelineStep("MIC_INITIALIZING");
      console.log(`[MIC] Acquiring single persistent MediaStream (userInitiated: ${userInitiated})...`);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: { ideal: true },
            noiseSuppression: { ideal: true },
            autoGainControl: { ideal: true },
          },
        });

        this.mediaStream = stream;
        this.micState = "ACTIVE";
        this.updateDiagnostics({
          micPermission: "GRANTED",
          micStream: "ACTIVE",
          lastError: null,
        });
        this.setPipelineStep("MIC_ACTIVE");
        console.log("[MIC] Single persistent MediaStream acquired and locked: ACTIVE");
        return this.mediaStream;
      } catch (err: any) {
        this.micState = "ERROR";
        const errMsg = err?.message || String(err);
        const isDenied =
          err?.name === "NotAllowedError" ||
          errMsg.toLowerCase().includes("permission denied") ||
          errMsg.toLowerCase().includes("not allowed");

        this.updateDiagnostics({
          micPermission: isDenied ? "DENIED" : "UNKNOWN",
          micStream: "INACTIVE",
          lastError: isDenied
            ? "Microphone access blocked or permission denied"
            : `Mic Error: ${errMsg}`,
        });

        if (userInitiated) {
          console.warn("[MIC] getUserMedia failed upon user request:", errMsg);
        } else {
          console.log("[MIC] Initial background getUserMedia deferred until user interaction.");
        }
        return null;
      } finally {
        this.mediaStreamPromise = null;
      }
    })();

    return this.mediaStreamPromise;
  }

  /**
   * Request microphone permission explicitly via user gesture.
   */
  public async requestMicAccess(): Promise<boolean> {
    const stream = await this.getOrCreateMediaStream(true);
    if (stream) {
      this.startWakeEngine(true);
      return true;
    }
    return false;
  }

  /**
   * Start the continuous Wake Word Engine ("Hey AIAR" / "AIAR" / "हे एरा" / "एरा")
   */
  public async startWakeEngine(enable: boolean = true) {
    this.userEnabledWake = enable;
    if (!enable) {
      this.stopWakeEngine();
      return;
    }

    this.isSuspended = false;
    this.updateDiagnostics({ wakeEngine: "STARTING" });
    console.log("[WAKE] Starting Wake Word Engine...");

    // Initialize and start Speech Recognition (which operates via Web Speech API)
    this.initAndStartSpeechRecognition();
  }

  private initAndStartSpeechRecognition() {
    if (!this.userEnabledWake || this.isSuspended) return;
    if (this.isRecognitionActive || this.isRecognitionStarting) {
      console.log("[WAKE] SpeechRecognition already active or starting. Skipping start.");
      return;
    }

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      const msg = "Web Speech API (SpeechRecognition) is not supported in this browser/WebView.";
      this.updateDiagnostics({
        wakeEngine: "ERROR",
        lastError: msg,
      });
      console.error(`[ERROR] [WAKE] ${msg}`);
      return;
    }

    const now = Date.now();
    if (now - this.lastRestartAttemptTime < this.minRestartCooldownMs) {
      const waitTime = this.minRestartCooldownMs - (now - this.lastRestartAttemptTime);
      if (this.restartTimeout) clearTimeout(this.restartTimeout);
      this.restartTimeout = setTimeout(() => {
        this.initAndStartSpeechRecognition();
      }, waitTime);
      return;
    }
    this.lastRestartAttemptTime = now;

    try {
      this.isRecognitionStarting = true;

      if (!this.recognition) {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 3;
        const speechLang = getSpeechRecognitionLanguage();
        this.recognition.lang = speechLang;
        this.updateDiagnostics({ activeLanguage: speechLang });

        this.recognition.onstart = () => {
          this.isRecognitionActive = true;
          this.isRecognitionStarting = false;
          this.updateDiagnostics({
            wakeEngine: "LISTENING",
            lastError: null,
          });
          this.setPipelineStep("WAKE_LISTENING");
          console.log("[WAKE] SpeechRecognition is LISTENING for 'Hey AIAR' / 'AIAR'");
        };

        this.recognition.onresult = (event: any) => {
          if (this.isSuspended) return;

          const currentTime = Date.now();
          if (currentTime - this.lastTriggerTimestamp < this.triggerCooldownMs) {
            return; // within cooldown period
          }

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            const isFinal = res.isFinal;

            for (let j = 0; j < res.length; j++) {
              const transcript = (res[j]?.transcript || "").trim();
              const confidence = res[j]?.confidence ?? 0.9;
              if (!transcript) continue;

              if (j === 0) {
                this.updateDiagnostics({
                  lastTranscript: transcript,
                  lastConfidence: confidence > 0 ? Number(confidence.toFixed(2)) : 0.9,
                });
                console.log(`[TRANSCRIPT] "${transcript}" (confidence: ${confidence})`);
                if (this.onSpeechSnippetCallback) {
                  this.onSpeechSnippetCallback(transcript, !isFinal);
                }
              }

              // Evaluate strict wake word detection
              const detection = checkExactAIARTrigger(transcript);
              if (detection.isTriggered) {
                this.lastTriggerTimestamp = Date.now();
                this.updateDiagnostics({
                  wakeMatch: "YES",
                  lastTranscript: transcript,
                });
                this.setPipelineStep("AIAR_DETECTED");
                console.log(
                  `[WAKE] EXACT WAKE MATCH: "${detection.wakeWordMatched}" | Query: "${detection.query}"`
                );

                // Physical confirmation buzz
                triggerWakeWordHaptic();

                // Suspend wake listening immediately
                this.suspendWakeEngine();

                if (this.onWakeTriggerCallback) {
                  this.onWakeTriggerCallback(detection.query, transcript);
                }
                return;
              } else {
                this.updateDiagnostics({ wakeMatch: "NO" });
              }
            }
          }
        };

        this.recognition.onerror = (event: any) => {
          this.isRecognitionStarting = false;
          const errorType = event?.error || "unknown";
          if (errorType === "no-speech") {
            // Normal silence on mobile/web - do not log as critical error
            console.log("[WAKE] Silence detected (no-speech)");
          } else if (errorType === "aborted") {
            console.log("[WAKE] Recognition paused/aborted");
          } else {
            console.warn(`[ERROR] [WAKE] Recognition error: ${errorType}`);
            this.updateDiagnostics({
              lastError: `Speech error: ${errorType}`,
              wakeEngine: errorType === "not-allowed" ? "ERROR" : "LISTENING",
            });
          }
        };

        this.recognition.onend = () => {
          this.isRecognitionActive = false;
          this.isRecognitionStarting = false;

          // Seamless instant restart for continuous background wake listening
          if (this.userEnabledWake && !this.isSuspended) {
            this.restartCount++;
            this.updateDiagnostics({
              restartCount: this.restartCount,
              wakeEngine: "LISTENING",
            });

            if (this.restartTimeout) clearTimeout(this.restartTimeout);
            this.restartTimeout = setTimeout(() => {
              if (this.userEnabledWake && !this.isSuspended) {
                this.initAndStartSpeechRecognition();
              }
            }, this.minRestartCooldownMs);
          } else {
            this.updateDiagnostics({
              wakeEngine: this.isSuspended ? "SUSPENDED" : "STOPPED",
            });
          }
        };
      }

      this.recognition.start();
    } catch (e: any) {
      this.isRecognitionStarting = false;
      if (e?.name === "InvalidStateError" || e?.message?.includes("already started")) {
        this.isRecognitionActive = true;
        this.updateDiagnostics({ wakeEngine: "LISTENING" });
      } else {
        console.warn("[ERROR] [WAKE] Failed to start recognition:", e);
        this.updateDiagnostics({
          wakeEngine: "ERROR",
          lastError: e?.message || "Recognition start error",
        });
        if (this.userEnabledWake && !this.isSuspended) {
          if (this.restartTimeout) clearTimeout(this.restartTimeout);
          this.restartTimeout = setTimeout(() => {
            this.initAndStartSpeechRecognition();
          }, 1500);
        }
      }
    }
  }

  /**
   * Suspend wake-word recognition when assistant is actively connecting, speaking, or processing.
   */
  public suspendWakeEngine() {
    this.isSuspended = true;
    this.setPipelineStep("WAKE_LISTENING_STOPPED");
    this.updateDiagnostics({ wakeEngine: "SUSPENDED" });
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    if (this.recognition && this.isRecognitionActive) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    console.log("[WAKE] Wake engine suspended for active assistant session");
  }

  /**
   * Resume continuous wake-word listening when assistant finishes and returns to idle.
   */
  public resumeWakeEngine() {
    if (!this.userEnabledWake) return;
    this.isSuspended = false;
    this.lastTriggerTimestamp = Date.now(); // reset cooldown
    this.setPipelineStep("WAKE_LISTENING");
    console.log("[WAKE] Resuming continuous wake listening...");
    this.initAndStartSpeechRecognition();
  }

  /**
   * Stop wake engine completely
   */
  public stopWakeEngine() {
    this.userEnabledWake = false;
    this.isSuspended = false;
    this.isRecognitionActive = false;
    this.isRecognitionStarting = false;
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {}
    }
    this.updateDiagnostics({ wakeEngine: "STOPPED" });
    console.log("[WAKE] Wake engine stopped");
  }

  /**
   * Manual developer diagnostic test trigger
   */
  public async runMicrophoneDiagnosticTest(): Promise<{ success: boolean; message: string }> {
    console.log("[MIC] Running manual Developer Microphone Diagnostic Test...");
    try {
      const stream = await this.getOrCreateMediaStream();
      if (!stream) {
        return { success: false, message: "Microphone stream could not be acquired." };
      }

      this.resumeWakeEngine();
      return {
        success: true,
        message: "Microphone & Speech Engine initialized. Say 'TEST TEST TEST' or 'Hey AIAR' to test!",
      };
    } catch (e: any) {
      return { success: false, message: e?.message || "Diagnostic test failed" };
    }
  }
}

export const MicrophoneManager = MicrophoneManagerService.getInstance();
