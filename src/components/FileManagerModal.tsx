import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Folder,
  X,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  Download,
  Trash2,
  Search,
  Upload,
  HardDrive,
  CheckCircle,
} from "lucide-react";
import { FileItem } from "../types/device";

interface FileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FileManagerModal({ isOpen, onClose }: FileManagerModalProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [files, setFiles] = useState<FileItem[]>([
    { id: "1", name: "Android_System_Architecture_Blueprint.pdf", type: "document", size: "2.4 MB", date: "Today" },
    { id: "2", name: "Aria_Voice_Model_Weights.bin", type: "archive", size: "48.2 MB", date: "Yesterday" },
    { id: "3", name: "Satyam_Dev_Project_Notes.txt", type: "document", size: "14 KB", date: "3 days ago" },
    { id: "4", name: "Studio_Photo_Capture_001.jpg", type: "image", size: "3.8 MB", date: "5 days ago" },
    { id: "5", name: "Bollywood_Retro_Mix_Aria.mp3", type: "audio", size: "8.1 MB", date: "1 week ago" },
    { id: "6", name: "Gemini_Live_WebRTC_Demo.mp4", type: "video", size: "64.0 MB", date: "2 weeks ago" },
  ]);

  if (!isOpen) return null;

  const handleDeleteFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const newFile: FileItem = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type.includes("image")
        ? "image"
        : file.type.includes("audio")
        ? "audio"
        : file.type.includes("video")
        ? "video"
        : "document",
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      date: "Just now",
    };
    setFiles((prev) => [newFile, ...prev]);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon size={16} className="text-pink-400" />;
      case "audio":
        return <Music size={16} className="text-emerald-400" />;
      case "video":
        return <Video size={16} className="text-violet-400" />;
      default:
        return <FileText size={16} className="text-cyan-400" />;
    }
  };

  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "all" || f.type === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div
      id="file-manager-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        className="bg-[#0b101c] border border-cyan-500/30 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400">
              <Folder size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Files & Storage Manager</h2>
              <p className="text-[11px] text-white/50">Internal Device Memory & Documents</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Storage Usage Bar */}
        <div className="p-4 border-b border-white/10 bg-black/20">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-white/80 font-medium flex items-center gap-1.5 font-mono">
              <HardDrive size={14} className="text-cyan-400" /> Internal Storage (38.2 GB / 128 GB)
            </span>
            <span className="text-cyan-400 font-mono">30% Used</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden flex">
            <div className="w-[12%] bg-cyan-500" title="System" />
            <div className="w-[8%] bg-purple-500" title="Apps" />
            <div className="w-[6%] bg-pink-500" title="Images" />
            <div className="w-[4%] bg-emerald-500" title="Audio" />
          </div>
        </div>

        {/* Filter & Upload Bar */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <label className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all">
            <Upload size={14} />
            <span>Upload File</span>
            <input type="file" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 py-2 border-b border-white/10 bg-white/5 overflow-x-auto no-scrollbar">
          {["all", "document", "image", "audio", "video"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-lg text-xs capitalize transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {tab}s
            </button>
          ))}
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <Folder className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No files found in this category</p>
            </div>
          ) : (
            filteredFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 shrink-0">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-semibold text-white truncate max-w-xs sm:max-w-md">
                      {file.name}
                    </h5>
                    <p className="text-[10px] text-white/40 font-mono">
                      {file.size} • {file.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
                    title="Delete File"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
