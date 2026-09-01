export interface AppItem {
  id: string;
  name: string;
  category: "social" | "system" | "media" | "tools" | "productivity";
  iconName: string;
  packageName?: string;
  url?: string;
  description?: string;
  badgeCount?: number;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatarColor: string;
  isFavorite?: boolean;
}

export interface SMSMessage {
  id: string;
  sender: string;
  phone: string;
  text: string;
  timestamp: string;
  isIncoming: boolean;
  unread?: boolean;
}

export interface NotificationItem {
  id: string;
  appName: string;
  appIcon: string;
  title: string;
  body: string;
  time: string;
  actionLabel?: string;
  isRead?: boolean;
}

export interface SystemSettings {
  volume: number; // 0-100
  ringVolume: number; // 0-100
  alarmVolume: number; // 0-100
  brightness: number; // 10-100
  flashlight: boolean;
  wifi: boolean;
  bluetooth: boolean;
  mobileData: boolean;
  hotspot: boolean;
  dnd: boolean; // Do Not Disturb
  autoRotate: boolean;
  soundMode: "sound" | "vibrate" | "silent";
  batteryLevel: number;
  isCharging: boolean;
  batterySaver: boolean;
  wakeWordEnabled: boolean;
  activeWakeWord: "Hey Aria" | "Hey Moon" | "Aria";
}

export interface FileItem {
  id: string;
  name: string;
  type: "image" | "video" | "audio" | "document" | "archive";
  size: string;
  date: string;
  url?: string;
  contentSnippet?: string;
}

export interface MediaTrack {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  coverUrl?: string;
  audioSrc?: string;
}

export interface AutomationActionLog {
  id: string;
  timestamp: string;
  command: string;
  category: string;
  status: "success" | "pending" | "warning" | "security_block";
  detail: string;
}
