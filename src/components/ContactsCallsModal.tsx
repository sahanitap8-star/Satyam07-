import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  User,
  Search,
  Plus,
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  UserCheck,
  Clock,
  Trash2,
} from "lucide-react";
import { Contact } from "../types/device";

interface ContactsCallsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTarget?: { name: string; phone: string } | null;
  contacts: Contact[];
  onAddContact: (contact: Contact) => void;
}

export default function ContactsCallsModal({
  isOpen,
  onClose,
  initialTarget,
  contacts,
  onAddContact,
}: ContactsCallsModalProps) {
  const [activeTab, setActiveTab] = useState<"dialer" | "contacts" | "recents">("dialer");
  const [dialNumber, setDialNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCall, setActiveCall] = useState<{ name: string; phone: string; duration: number } | null>(null);
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");

  const [callHistory, setCallHistory] = useState<Array<{ id: string; name: string; phone: string; time: string; type: "outgoing" | "incoming" | "missed" }>>([
    { id: "1", name: "Satyam Sahani", phone: "+91 98765 43210", time: "10 mins ago", type: "outgoing" },
    { id: "2", name: "Rohan Sharma", phone: "+91 91234 56789", time: "1 hour ago", type: "incoming" },
    { id: "3", name: "Ananya Patel", phone: "+91 99887 76655", time: "Yesterday", type: "missed" },
  ]);

  // Handle direct call target if triggered via voice command
  useEffect(() => {
    if (initialTarget && isOpen) {
      startCall(initialTarget.name, initialTarget.phone);
    }
  }, [initialTarget, isOpen]);

  // Call duration timer
  useEffect(() => {
    let interval: any = null;
    if (activeCall) {
      interval = setInterval(() => {
        setActiveCall((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : null));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  if (!isOpen) return null;

  const startCall = (name: string, phone: string) => {
    setActiveCall({ name, phone, duration: 0 });
    setCallHistory((prev) => [
      { id: Date.now().toString(), name, phone, time: "Just now", type: "outgoing" },
      ...prev,
    ]);
  };

  const endCall = () => {
    setActiveCall(null);
  };

  const formatCallTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleKeypadPress = (digit: string) => {
    setDialNumber((prev) => prev + digit);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    const colors = ["from-emerald-500 to-teal-500", "from-cyan-500 to-blue-500", "from-violet-500 to-purple-500", "from-rose-500 to-pink-500"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    onAddContact({
      id: Date.now().toString(),
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      avatarColor: randomColor,
    });
    setNewContactName("");
    setNewContactPhone("");
    setShowAddContact(false);
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  return (
    <div
      id="contacts-calls-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        className="bg-[#0b101c] border border-cyan-500/30 rounded-2xl w-full max-w-md h-[600px] flex flex-col shadow-2xl overflow-hidden relative"
      >
        {/* ACTIVE CALL OVERLAY */}
        <AnimatePresence>
          {activeCall && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-30 bg-gradient-to-b from-[#0a1128] via-[#050914] to-black flex flex-col items-center justify-between p-6"
            >
              {/* Call Top Details */}
              <div className="flex flex-col items-center text-center mt-6">
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Call in progress
                </span>
                <h3 className="text-2xl font-bold text-white mb-1">{activeCall.name}</h3>
                <p className="text-sm font-mono text-white/50">{activeCall.phone}</p>
                <div className="mt-4 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-cyan-300 font-mono text-sm">
                  {formatCallTime(activeCall.duration)}
                </div>
              </div>

              {/* Large Caller Avatar */}
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-600 p-1 shadow-2xl shadow-cyan-500/20">
                <div className="w-full h-full rounded-full bg-[#070b14] flex items-center justify-center text-3xl font-bold text-white">
                  {activeCall.name.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Call Controls */}
              <div className="w-full space-y-6">
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={() => setIsCallMuted(!isCallMuted)}
                    className={`p-4 rounded-full border transition-all cursor-pointer ${
                      isCallMuted
                        ? "bg-red-500/20 border-red-500/50 text-red-400"
                        : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {isCallMuted ? <MicOff size={22} /> : <Mic size={22} />}
                  </button>
                  <button
                    onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    className={`p-4 rounded-full border transition-all cursor-pointer ${
                      isSpeakerOn
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                        : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
                  </button>
                </div>

                {/* End Call Button */}
                <button
                  onClick={endCall}
                  className="w-full py-4 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                >
                  <PhoneOff size={20} />
                  <span>End Call</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Phone size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Phone & Contacts</h2>
              <p className="text-[11px] text-white/50">Aria Telecom & Dialer Service</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-white/5">
          <button
            onClick={() => setActiveTab("dialer")}
            className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === "dialer"
                ? "border-cyan-400 text-cyan-300 bg-white/5"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            Dialer Pad
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === "contacts"
                ? "border-cyan-400 text-cyan-300 bg-white/5"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            Contacts ({contacts.length})
          </button>
          <button
            onClick={() => setActiveTab("recents")}
            className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === "recents"
                ? "border-cyan-400 text-cyan-300 bg-white/5"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            Call Log
          </button>
        </div>

        {/* TAB 1: DIALER PAD */}
        {activeTab === "dialer" && (
          <div className="flex-1 flex flex-col justify-between p-5">
            {/* Display Area */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-xl border border-white/10">
              <input
                id="dialer-input"
                type="text"
                value={dialNumber}
                onChange={(e) => setDialNumber(e.target.value)}
                placeholder="Enter phone number..."
                className="w-full bg-transparent text-xl font-mono text-center text-white placeholder:text-white/20 focus:outline-none tracking-widest"
              />
              {dialNumber && (
                <button
                  onClick={() => setDialNumber((prev) => prev.slice(0, -1))}
                  className="p-1 text-white/40 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-3 my-auto">
              {[
                { digit: "1", sub: "" },
                { digit: "2", sub: "ABC" },
                { digit: "3", sub: "DEF" },
                { digit: "4", sub: "GHI" },
                { digit: "5", sub: "JKL" },
                { digit: "6", sub: "MNO" },
                { digit: "7", sub: "PQRS" },
                { digit: "8", sub: "TUV" },
                { digit: "9", sub: "WXYZ" },
                { digit: "*", sub: "" },
                { digit: "0", sub: "+" },
                { digit: "#", sub: "" },
              ].map((key) => (
                <button
                  key={key.digit}
                  onClick={() => handleKeypadPress(key.digit)}
                  className="h-12 rounded-xl bg-white/5 hover:bg-white/15 border border-white/5 hover:border-cyan-500/30 flex flex-col items-center justify-center text-white transition-all active:scale-95 cursor-pointer"
                >
                  <span className="text-lg font-bold font-mono leading-none">{key.digit}</span>
                  {key.sub && <span className="text-[9px] text-white/40 font-mono mt-0.5">{key.sub}</span>}
                </button>
              ))}
            </div>

            {/* Call Action Button */}
            <button
              onClick={() => {
                if (dialNumber.trim()) {
                  startCall("Unknown Contact", dialNumber.trim());
                }
              }}
              disabled={!dialNumber.trim()}
              className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <PhoneCall size={18} />
              <span>Call via Aria</span>
            </button>
          </div>
        )}

        {/* TAB 2: CONTACTS DIRECTORY */}
        {activeTab === "contacts" && (
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            {/* Search & Add Bar */}
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts..."
                  className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <button
                onClick={() => setShowAddContact(!showAddContact)}
                className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer"
                title="Add New Contact"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Add Contact Form */}
            {showAddContact && (
              <form onSubmit={handleSaveContact} className="p-3 mb-3 rounded-xl bg-white/5 border border-cyan-500/30 space-y-2">
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="Full Name (e.g. Satyam Sahani)"
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder:text-white/30"
                  autoFocus
                />
                <input
                  type="text"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  placeholder="Phone Number (e.g. +91 98765 43210)"
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder:text-white/30"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddContact(false)}
                    className="px-2.5 py-1 text-xs text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-cyan-500 text-black font-semibold text-xs rounded-lg shadow"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}

            {/* Contact List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredContacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center font-bold text-xs text-white">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">{c.name}</h4>
                      <p className="text-[11px] text-white/50 font-mono">{c.phone}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => startCall(c.name, c.phone)}
                    className="p-2 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
                    title={`Call ${c.name}`}
                  >
                    <Phone size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: RECENTS CALL LOG */}
        {activeTab === "recents" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {callHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5 text-white/70">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">{item.name}</h4>
                    <p className="text-[10px] text-white/40 font-mono">
                      {item.phone} • {item.time}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => startCall(item.name, item.phone)}
                  className="p-2 rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                  <PhoneCall size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
