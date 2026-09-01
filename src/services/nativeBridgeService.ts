import { Capacitor, registerPlugin } from "@capacitor/core";

export interface AriaNativePlugin {
  checkNativePermissions(): Promise<{
    microphone: boolean;
    accessibility: boolean;
    notificationListener: boolean;
    overlay: boolean;
    batteryOptimizationExempt: boolean;
    camera: boolean;
    contacts: boolean;
    foregroundServiceRunning: boolean;
  }>;
  openNativeSettings(options: { target: string }): Promise<{ success: boolean }>;
  performAccessibilityAction(options: {
    action: string;
    text?: string;
    exact?: boolean;
    direction?: string;
  }): Promise<{ success: boolean; error?: string; summary?: string }>;
  getNativeNotifications(): Promise<{
    notifications: string;
    isListenerActive: boolean;
  }>;
  toggleForegroundService(options: { enable: boolean }): Promise<{ running: boolean }>;
  toggleFlashlight(options: { enable: boolean }): Promise<{ success: boolean; state: boolean }>;
}

export const AriaNativeBridge = registerPlugin<AriaNativePlugin>("AriaNativeBridge");

export const isNativeAndroid = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
};

export async function requestNativeSettings(target: string): Promise<boolean> {
  if (isNativeAndroid()) {
    try {
      const res = await AriaNativeBridge.openNativeSettings({ target });
      return res.success;
    } catch (err) {
      console.warn("[AriaNativeBridge] Could not open native settings:", err);
    }
  }
  return false;
}

export async function checkAndroidNativePermissions() {
  if (isNativeAndroid()) {
    try {
      return await AriaNativeBridge.checkNativePermissions();
    } catch (err) {
      console.warn("[AriaNativeBridge] Native permission check error:", err);
    }
  }
  return null;
}
