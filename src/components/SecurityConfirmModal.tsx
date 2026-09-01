import React from "react";
import { motion } from "motion/react";
import { ShieldAlert, X, AlertTriangle, Check, Lock } from "lucide-react";

interface SecurityConfirmModalProps {
  isOpen: boolean;
  title: string;
  risk: string;
  actionToPerform: string;
  onClose: () => void;
  onAuthorize?: () => void;
}

export default function SecurityConfirmModal({
  isOpen,
  title,
  risk,
  actionToPerform,
  onClose,
  onAuthorize,
}: SecurityConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      id="security-confirm-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        className="bg-[#100812] border border-red-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-hidden text-center relative"
      >
        {/* Top Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-400">
          <ShieldAlert size={32} />
        </div>

        <h3 className="text-lg font-bold text-white mb-2">{title || "Security Boundary Alert"}</h3>
        <p className="text-xs text-red-300 font-mono mb-4 px-2 py-1 bg-red-500/10 rounded-lg border border-red-500/20 inline-block">
          {risk || "Restricted System Operation"}
        </p>

        <p className="text-xs text-white/70 leading-relaxed mb-6">
          Aria follows strict Android security and compliance rules. Actions involving PIN/biometric bypass, banking authentication, or unauthorized private access are strictly guarded.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Dismiss / Safe Return
          </button>
          {onAuthorize && (
            <button
              onClick={onAuthorize}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-600/30 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Lock size={14} />
              <span>Confirm Action</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
