/**
 * Haptic feedback utility for Aria Assistant
 * Triggers physical tactile vibration confirmations on supported devices (Android, Mobile Web, PWA)
 * with graceful fallback handling.
 */

const HAPTIC_STORAGE_KEY = "ARIA_HAPTIC_FEEDBACK_ENABLED";

export function isHapticSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    "vibrate" in navigator &&
    typeof navigator.vibrate === "function"
  );
}

export function getHapticFeedbackEnabled(): boolean {
  if (typeof window !== "undefined") {
    const val = localStorage.getItem(HAPTIC_STORAGE_KEY);
    if (val !== null) {
      return val === "true";
    }
  }
  return true; // Enabled by default for rich tactile feedback
}

export function setHapticFeedbackEnabled(enabled: boolean) {
  if (typeof window !== "undefined") {
    localStorage.setItem(HAPTIC_STORAGE_KEY, enabled ? "true" : "false");
  }
}

/**
 * Triggers standard dual-pulse haptic confirmation upon successful wake-word detection
 * e.g., 'Aira' / 'Hey Aiar' recognition.
 * Pattern: [40ms pulse, 60ms pause, 40ms pulse] (standard crisp confirmation buzz)
 */
export function triggerWakeWordHaptic(): boolean {
  if (!getHapticFeedbackEnabled()) return false;

  if (isHapticSupported()) {
    try {
      // Dual crisp vibration pulse for physical wake confirmation
      const success = navigator.vibrate([40, 60, 40]);
      console.log("[Haptic] Wake word vibration triggered:", success ? "OK" : "rejected");
      return success;
    } catch (e) {
      console.debug("[Haptic] Vibration call error:", e);
    }
  }
  return false;
}

/**
 * Short subtle tick for UI actions (clicks, buttons, quick toggle)
 */
export function triggerLightHaptic(): boolean {
  if (!getHapticFeedbackEnabled()) return false;

  if (isHapticSupported()) {
    try {
      return navigator.vibrate(25);
    } catch (e) {
      console.debug("[Haptic] Light vibration error:", e);
    }
  }
  return false;
}

/**
 * Single distinct buzz for successful execution completion
 */
export function triggerSuccessHaptic(): boolean {
  if (!getHapticFeedbackEnabled()) return false;

  if (isHapticSupported()) {
    try {
      return navigator.vibrate([30, 40, 60]);
    } catch (e) {
      console.debug("[Haptic] Success vibration error:", e);
    }
  }
  return false;
}
