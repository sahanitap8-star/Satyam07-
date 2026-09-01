import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  X,
  Trash2,
  MessageCircle,
  Mail,
  Calendar,
  BatteryCharging,
  Sparkles,
  Check,
  CornerDownRight,
} from "lucide-react";
import { NotificationItem } from "../types/device";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  onActionClick?: (notif: NotificationItem) => void;
}

export default function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  onDismiss,
  onClearAll,
  onActionClick,
}: NotificationCenterProps) {
  const [replyInputId, setReplyInputId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  if (!isOpen) return null;

  const getNotificationIcon = (iconName: string) => {
    switch (iconName) {
      case "message":
        return <MessageCircle size={16} className="text-emerald-400" />;
      case "mail":
        return <Mail size={16} className="text-rose-400" />;
      case "calendar":
        return <Calendar size={16} className="text-purple-400" />;
      case "battery":
        return <BatteryCharging size={16} className="text-cyan-400" />;
      default:
        return <Sparkles size={16} className="text-amber-400" />;
    }
  };

  const handleSendReply = (notif: NotificationItem) => {
    if (!replyText.trim()) return;
    alert(`Aria auto-replied to ${notif.appName}: "${replyText}"`);
    setReplyText("");
    setReplyInputId(null);
    onDismiss(notif.id);
  };

  return (
    <div
      id="notification-center-overlay"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: -20 }}
        className="bg-[#0b101c] border border-cyan-500/30 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden mt-6"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <Bell size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Notification Center</h2>
              <p className="text-[11px] text-white/50">
                {notifications.length} Active Alerts & Messages
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400 text-xs font-mono border border-white/10 transition-colors cursor-pointer"
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

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-white/40">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30 text-cyan-400" />
              <p className="text-sm font-medium text-white/70">No New Notifications</p>
              <p className="text-xs text-white/40 mt-1">Aria is keeping your device quiet and organized</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex flex-col gap-2 relative group"
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-black/40 border border-white/10">
                      {getNotificationIcon(notif.appIcon)}
                    </div>
                    <span className="text-xs font-semibold text-white/90">{notif.appName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-white/40">{notif.time}</span>
                    <button
                      onClick={() => onDismiss(notif.id)}
                      className="text-white/30 hover:text-red-400 transition-colors p-1"
                      title="Dismiss"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">{notif.title}</h4>
                  <p className="text-xs text-white/70 leading-relaxed">{notif.body}</p>
                </div>

                {/* Action Row */}
                <div className="flex items-center gap-2 pt-1">
                  {notif.actionLabel && (
                    <button
                      onClick={() => onActionClick && onActionClick(notif)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[11px] font-medium border border-cyan-500/30 transition-colors cursor-pointer"
                    >
                      {notif.actionLabel}
                    </button>
                  )}

                  <button
                    onClick={() =>
                      setReplyInputId(replyInputId === notif.id ? null : notif.id)
                    }
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[11px] transition-colors cursor-pointer"
                  >
                    Quick Reply
                  </button>
                </div>

                {/* Inline Quick Reply Input */}
                {replyInputId === notif.id && (
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type reply message..."
                      className="flex-1 px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSendReply(notif)}
                      className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Send
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
