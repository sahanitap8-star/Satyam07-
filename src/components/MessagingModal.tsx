import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  MessageCircle,
  Send,
  X,
  Search,
  Plus,
  Sparkles,
  CheckCheck,
  ExternalLink,
  Phone,
  Paperclip,
} from "lucide-react";
import { SMSMessage, Contact } from "../types/device";

interface MessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTarget?: { phone: string; text: string; recipientName?: string } | null;
  contacts: Contact[];
}

export default function MessagingModal({
  isOpen,
  onClose,
  initialTarget,
  contacts,
}: MessagingModalProps) {
  const [messages, setMessages] = useState<SMSMessage[]>([
    {
      id: "1",
      sender: "Satyam Sahani",
      phone: "+91 98765 43210",
      text: "Aria, system update ready hai kya?",
      timestamp: "10:30 AM",
      isIncoming: true,
    },
    {
      id: "2",
      sender: "Aria Voice AI",
      phone: "+91 98765 43210",
      text: "Haan Satyam, full Android Intent automation layer deploy ho chuki hai!",
      timestamp: "10:31 AM",
      isIncoming: false,
    },
    {
      id: "3",
      sender: "HDFC Bank Alert",
      phone: "HDFC-BANK",
      text: "Your OTP for account verification is 482910. Do NOT share with anyone.",
      timestamp: "Yesterday",
      isIncoming: true,
    },
  ]);

  const [activeRecipient, setActiveRecipient] = useState<string>("Satyam Sahani");
  const [activePhone, setActivePhone] = useState<string>("+91 98765 43210");
  const [inputText, setInputText] = useState("");
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [newRecipientInput, setNewRecipientInput] = useState("");

  useEffect(() => {
    if (initialTarget && isOpen) {
      const targetName = initialTarget.recipientName || initialTarget.phone;
      setActiveRecipient(targetName);
      setActivePhone(initialTarget.phone);
      if (initialTarget.text) {
        setInputText(initialTarget.text);
      }
    }
  }, [initialTarget, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: SMSMessage = {
      id: Date.now().toString(),
      sender: "You (Aria)",
      phone: activePhone,
      text: inputText.trim(),
      timestamp: "Just now",
      isIncoming: false,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    // Simulated auto-reply from contact after 1.5s
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: activeRecipient,
          phone: activePhone,
          text: `Message received: "${newMsg.text}" 👍`,
          timestamp: "Just now",
          isIncoming: true,
        },
      ]);
    }, 1500);
  };

  const handleQuickTemplate = (tpl: string) => {
    setInputText(tpl);
  };

  const handleOpenWhatsApp = () => {
    const rawNumber = activePhone.replace(/[^\d+]/g, "");
    const url = `https://web.whatsapp.com/send?phone=${rawNumber}&text=${encodeURIComponent(inputText || "Hello from Aria Assistant!")}`;
    window.open(url, "_blank");
  };

  return (
    <div
      id="messaging-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        className="bg-[#0b101c] border border-cyan-500/30 rounded-2xl w-full max-w-2xl h-[620px] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <MessageCircle size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">SMS & Messaging Hub</h2>
              <p className="text-[11px] text-white/50">Aria SMS & WhatsApp Automation Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main 2-Column Messaging Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Conversation List */}
          <div className="w-1/3 border-r border-white/10 flex flex-col bg-black/20">
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-mono text-white/60">Conversations</span>
              <button
                onClick={() => setShowNewMessageModal(true)}
                className="p-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-cyan-400 transition-colors"
                title="New Chat"
              >
                <Plus size={15} />
              </button>
            </div>

            {/* Conversation Threads */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {[
                { name: "Satyam Sahani", phone: "+91 98765 43210", preview: "System update ready hai..." },
                { name: "Ananya Patel", phone: "+91 99887 76655", preview: "Meeting at 5 PM today" },
                { name: "HDFC Bank Alert", phone: "HDFC-BANK", preview: "OTP: 482910..." },
              ].map((thread) => (
                <button
                  key={thread.phone}
                  onClick={() => {
                    setActiveRecipient(thread.name);
                    setActivePhone(thread.phone);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-2.5 cursor-pointer ${
                    activeRecipient === thread.name
                      ? "bg-cyan-500/15 border border-cyan-500/30 text-white"
                      : "hover:bg-white/5 text-white/70 border border-transparent"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shrink-0">
                    {thread.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-semibold truncate text-white">{thread.name}</h5>
                    <p className="text-[10px] text-white/40 truncate">{thread.preview}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Chat Window */}
          <div className="flex-1 flex flex-col bg-gradient-to-b from-[#0a0f1d] to-[#060a14]">
            {/* Chat Target Bar */}
            <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{activeRecipient}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </h4>
                <p className="text-[10px] font-mono text-white/40">{activePhone}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenWhatsApp}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-mono border border-emerald-500/30 flex items-center gap-1 transition-all cursor-pointer"
                  title="Open in WhatsApp Web"
                >
                  <span>WhatsApp</span>
                  <ExternalLink size={11} />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.isIncoming ? "items-start" : "items-end"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-md ${
                      msg.isIncoming
                        ? "bg-white/10 text-white rounded-tl-sm border border-white/10"
                        : "bg-cyan-600 text-white rounded-tr-sm shadow-cyan-600/20"
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-60 font-mono">
                      <span>{msg.timestamp}</span>
                      {!msg.isIncoming && <CheckCheck size={11} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Template Chips */}
            <div className="px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-white/5 bg-black/20">
              <span className="text-[10px] text-white/40 shrink-0 font-mono">Quick:</span>
              {[
                "Namaste!",
                "On my way 🚗",
                "Please call me back",
                "Meeting in 10 mins",
                "All done! 👍",
              ].map((tpl) => (
                <button
                  key={tpl}
                  onClick={() => handleQuickTemplate(tpl)}
                  className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white text-[10px] whitespace-nowrap transition-colors cursor-pointer"
                >
                  {tpl}
                </button>
              ))}
            </div>

            {/* Compose Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-white/5 flex items-center gap-2">
              <input
                id="sms-compose-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Type SMS / WhatsApp message to ${activeRecipient}...`}
                className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
