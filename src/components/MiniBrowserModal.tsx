import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Globe,
  X,
  Search,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  ExternalLink,
  Bookmark,
  Share2,
} from "lucide-react";

interface MiniBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTarget?: { url: string; query?: string } | null;
}

export default function MiniBrowserModal({
  isOpen,
  onClose,
  initialTarget,
}: MiniBrowserModalProps) {
  const [urlInput, setUrlInput] = useState("https://www.google.com");
  const [currentUrl, setCurrentUrl] = useState("https://www.google.com");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialTarget && isOpen) {
      if (initialTarget.url) {
        setUrlInput(initialTarget.url);
        setCurrentUrl(initialTarget.url);
      }
      if (initialTarget.query) {
        setSearchQuery(initialTarget.query);
      }
    }
  }, [initialTarget, isOpen]);

  if (!isOpen) return null;

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    let finalUrl = urlInput.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      if (finalUrl.includes(".") && !finalUrl.includes(" ")) {
        finalUrl = "https://" + finalUrl;
      } else {
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`;
      }
    }
    setCurrentUrl(finalUrl);
    setUrlInput(finalUrl);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 800);
  };

  const quickBookmarks = [
    { name: "Google", url: "https://www.google.com", icon: "🔍" },
    { name: "YouTube", url: "https://www.youtube.com", icon: "▶️" },
    { name: "Wikipedia", url: "https://www.wikipedia.org", icon: "📚" },
    { name: "GitHub", url: "https://github.com", icon: "🐙" },
    { name: "Twitter / X", url: "https://twitter.com", icon: "🐦" },
  ];

  const safeOpenWindow = (url: string) => {
    try {
      window.open(url, "_blank");
    } catch (e) {
      console.warn("Unable to open external window:", e);
    }
  };

  return (
    <div
      id="mini-browser-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-6 animate-in fade-in duration-200"
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        className="bg-[#0b101c] border border-cyan-500/30 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Top Browser Bar */}
        <div className="p-3 border-b border-white/10 bg-white/5 flex items-center gap-2">
          {/* Controls */}
          <div className="flex items-center gap-1.5 text-white/60">
            <button
              onClick={() => {}}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              onClick={() => {}}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
            >
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 600);
              }}
              className={`p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white ${
                isLoading ? "animate-spin text-cyan-400" : ""
              }`}
            >
              <RotateCw size={16} />
            </button>
          </div>

          {/* Address Bar */}
          <form onSubmit={handleNavigate} className="flex-1 flex items-center gap-2">
            <div className="flex-1 flex items-center bg-black/50 border border-white/15 rounded-xl px-3 py-1.5 focus-within:border-cyan-400">
              <Globe size={14} className="text-cyan-400 mr-2 shrink-0" />
              <input
                id="browser-url-input"
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Search web or enter URL..."
                className="w-full bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none font-mono"
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => safeOpenWindow(currentUrl)}
              className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs flex items-center gap-1 border border-cyan-500/30 cursor-pointer"
              title="Open in new window"
            >
              <ExternalLink size={15} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Quick Bookmarks Bar */}
        <div className="px-4 py-1.5 bg-black/30 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {quickBookmarks.map((bm) => (
            <button
              key={bm.name}
              onClick={() => {
                setUrlInput(bm.url);
                setCurrentUrl(bm.url);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              <span>{bm.icon}</span>
              <span>{bm.name}</span>
            </button>
          ))}
        </div>

        {/* Browser Content Frame / Safe Proxy View */}
        <div className="flex-1 bg-white relative flex flex-col">
          {isLoading ? (
            <div className="absolute inset-0 bg-[#0c1222] flex flex-col items-center justify-center text-white">
              <div className="w-10 h-10 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-3" />
              <p className="text-xs font-mono text-cyan-300">Loading {urlInput}...</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#0b101f] to-[#040711] text-white text-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 text-cyan-400">
                <Globe size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Aria Smart Web Search</h3>
              <p className="text-sm text-white/60 max-w-md mb-6 leading-relaxed">
                Navigating to: <span className="text-cyan-300 font-mono">{currentUrl}</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => safeOpenWindow(currentUrl)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  <ExternalLink size={16} />
                  <span>Launch in Full Window</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
