import React, { useState } from "react";
import { motion } from "motion/react";
import { User, Sparkles, ArrowRight, Check, X, RotateCcw } from "lucide-react";

interface NameModalProps {
  initialName?: string;
  onSave: (name: string) => void;
  onClose?: () => void;
}

export default function NameModal({ initialName = "", onSave, onClose }: NameModalProps) {
  const [name, setName] = useState(initialName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  const handleQuickSelect = (suggestedName: string) => {
    setName(suggestedName);
    onSave(suggestedName);
  };

  const handleReset = () => {
    setName("");
    onSave("");
    if (onClose) onClose();
  };

  return (
    <div
      id="aria-name-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-[#0b0f19] border border-cyan-500/30 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden"
        style={{
          boxShadow: "0 0 50px rgba(6, 182, 212, 0.15), inset 0 0 30px rgba(139, 92, 246, 0.1)",
        }}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X size={16} />
          </button>
        )}

        {/* Subtle glowing orb background */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Aira Avatar Icon */}
        <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-0.5 mb-5 shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-[#070a12] rounded-full flex items-center justify-center relative">
            <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-dashed border-cyan-400/40"
            />
          </div>
        </div>

        {/* Title and Introduction */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-mono tracking-wider mb-2">
          <span>AIRA VOICE AI</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2">
          {initialName ? "Apna Naam Badlein" : "Aapka Naam Kya Hai?"}
        </h2>
        <p className="text-white/70 text-sm mb-6 leading-relaxed">
          Namaste! Main hoon <strong className="text-cyan-400 font-semibold">Aira (एरा)</strong>. Aap apna naam yahan set ya change kar sakte hain.
        </p>

        {/* Name Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative flex items-center">
            <div className="absolute left-4 text-cyan-400/70">
              <User className="w-5 h-5" />
            </div>
            <input
              id="aria-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Apna naam enter karein..."
              autoFocus
              className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-cyan-500/30 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-sans"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex gap-2">
            <button
              id="aria-save-name-btn"
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Save & Update</span>
              <Check className="w-4 h-4" />
            </button>

            {initialName && (
              <button
                type="button"
                onClick={handleReset}
                className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-red-300 border border-white/10 text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Remove / Clear Name"
              >
                <RotateCcw size={14} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </form>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
      </motion.div>
    </div>
  );
}
