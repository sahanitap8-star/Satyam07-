// Strict wake-word matcher for "hey aiar" and "aiar" specifically.
// Uses strict regex matching and maintains a single consistent microphone stream instance to prevent cycling ON/OFF.
import {
  MicrophoneManager,
  normalizeTranscriptForAIAR,
  checkExactAIARTrigger,
  STRICT_AIAR_WAKE_REGEX,
  WAKE_WORDS_LIST,
} from "./microphoneManager";

/**
 * Strict case-insensitive Regex for phrases: /\b(hey\s+)?(aria|aiar)\b/i
 * Accurately matches "Hey Aria", "hey aria", "Aria", "aria", "Hey Aiar", "hey aiar", "Aiar", "aiar" with full word boundaries,
 * strictly ignoring partial matches like "AI", "iar", "hey ai", "airplane", etc.
 */
export const STRICT_AIAR_REGEX = /\b(hey\s+)?(aria|aiar)\b/i;

export { STRICT_AIAR_WAKE_REGEX, WAKE_WORDS_LIST };

export type WakeWordSensitivity = "low" | "medium" | "high";

export interface TriggerDetectionResult {
  isTriggered: boolean;
  wakeWordMatched: string;
  query: string;
  confidence: number;
}

const SENSITIVITY_STORAGE_KEY = "ARIA_WAKE_WORD_SENSITIVITY";

export function getWakeWordSensitivity(): WakeWordSensitivity {
  if (typeof window !== "undefined") {
    const val = localStorage.getItem(SENSITIVITY_STORAGE_KEY) as WakeWordSensitivity;
    if (val === "low" || val === "medium" || val === "high") return val;
  }
  return "medium";
}

export function setWakeWordSensitivity(sensitivity: WakeWordSensitivity) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SENSITIVITY_STORAGE_KEY, sensitivity);
  }
}

export function normalizeTranscript(text: string): string {
  return normalizeTranscriptForAIAR(text);
}

/**
 * Checks trigger phrase using a strict case-insensitive Regex: /\b(hey\s+)?aiar\b/i,
 * ensuring it correctly identifies 'Hey Aiar' and 'Aiar' while ignoring partial matches like 'AI' or 'iar'.
 */
export function checkTriggerPhrase(
  rawTranscript: string,
  _sensitivity: WakeWordSensitivity = getWakeWordSensitivity()
): TriggerDetectionResult {
  const trimmed = rawTranscript ? rawTranscript.trim() : "";
  if (!trimmed) {
    return { isTriggered: false, wakeWordMatched: "", query: "", confidence: 0 };
  }

  // 1. Strict case-insensitive regex check on raw transcript
  const match = STRICT_AIAR_REGEX.exec(trimmed);
  if (match) {
    const matchedPhrase = match[0];
    const matchIndex = match.index;
    const query = trimmed.slice(matchIndex + matchedPhrase.length).trim();

    return {
      isTriggered: true,
      wakeWordMatched: matchedPhrase,
      query,
      confidence: 1.0,
    };
  }

  // 2. Strict case-insensitive regex check on normalized transcript (handles letter spacing, accents, punctuation)
  const normalized = normalizeTranscriptForAIAR(trimmed);
  const normMatch = STRICT_AIAR_REGEX.exec(normalized);
  if (normMatch) {
    const matchedPhrase = normMatch[0];
    const matchIndex = normMatch.index;
    const query = normalized.slice(matchIndex + matchedPhrase.length).trim();

    return {
      isTriggered: true,
      wakeWordMatched: matchedPhrase,
      query,
      confidence: 1.0,
    };
  }

  // 3. Fallback to checkExactAIARTrigger for multilingual/phonetic variants (e.g. Hindi 'एरा', 'हे एरा', 'aira')
  return checkExactAIARTrigger(rawTranscript);
}

/**
 * Continuous WakeWordService wrapping around singleton MicrophoneManager
 * Maintains a single consistent stream instance and avoids rapid ON/OFF cycling.
 */
export class WakeWordService {
  private onTriggered: (query: string, rawTranscript: string) => void;
  private onSpeechSnippet: (text: string, isInterim: boolean) => void;
  private onListeningStateChange: (isListening: boolean) => void;

  constructor(
    onTriggered: (query: string, rawTranscript: string) => void,
    onSpeechSnippet: (text: string, isInterim: boolean) => void = () => {},
    onListeningStateChange: (isListening: boolean) => void = () => {}
  ) {
    this.onTriggered = onTriggered;
    this.onSpeechSnippet = onSpeechSnippet;
    this.onListeningStateChange = onListeningStateChange;
    MicrophoneManager.setCallbacks(this.onTriggered, this.onSpeechSnippet);
  }

  public setSensitivity(sensitivity: WakeWordSensitivity) {
    setWakeWordSensitivity(sensitivity);
  }

  public getSensitivity(): WakeWordSensitivity {
    return getWakeWordSensitivity();
  }

  public isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    );
  }

  public async start() {
    MicrophoneManager.setCallbacks(this.onTriggered, this.onSpeechSnippet);
    // Explicit single stream acquisition check
    await MicrophoneManager.getOrCreateMediaStream();
    MicrophoneManager.startWakeEngine(true);
    this.onListeningStateChange(true);
  }

  public suspend() {
    MicrophoneManager.suspendWakeEngine();
    this.onListeningStateChange(false);
  }

  public resume() {
    MicrophoneManager.resumeWakeEngine();
    this.onListeningStateChange(true);
  }

  public stop() {
    MicrophoneManager.stopWakeEngine();
    this.onListeningStateChange(false);
  }

  public getStatus(): boolean {
    return MicrophoneManager.getDiagnostics().wakeEngine === "LISTENING";
  }
}

