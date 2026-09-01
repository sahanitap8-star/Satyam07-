import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Music,
  Repeat,
  Shuffle,
  Disc,
} from "lucide-react";
import { MediaTrack } from "../types/device";

interface MediaPlayerBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  volume: number;
}

const PLAYLIST: MediaTrack[] = [
  { id: "1", title: "Aria Cyber Lo-Fi Beat", artist: "Satyam & Aria Studio", duration: 184 },
  { id: "2", title: "Kesariya (Acoustic Chill)", artist: "Arijit Singh", duration: 210 },
  { id: "3", title: "Midnight Mumbai Synthwave", artist: "Aria Beats", duration: 165 },
];

export default function MediaPlayerBar({
  isPlaying,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  volume,
}: MediaPlayerBarProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [progress, setProgress] = useState(35); // in seconds
  const currentTrack = PLAYLIST[currentTrackIndex];

  // Simulated audio progress timer
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= currentTrack.duration) {
            handleNext();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack.duration]);

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
    setProgress(0);
    onNextTrack();
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
    setProgress(0);
    onPrevTrack();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      id="media-player-bar"
      className="w-full bg-[#0a0e1a]/95 backdrop-blur-md border-t border-cyan-500/20 px-4 py-2.5 flex items-center justify-between gap-4 z-40 transition-all"
    >
      {/* Left: Track Details */}
      <div className="flex items-center gap-3 min-w-0 max-w-[240px]">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md ${
            isPlaying ? "animate-spin-slow" : ""
          }`}
        >
          <Disc size={20} />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-semibold text-white truncate">{currentTrack.title}</h4>
          <p className="text-[10px] text-white/50 truncate font-mono">{currentTrack.artist}</p>
        </div>
      </div>

      {/* Center: Controls & Scrubber */}
      <div className="flex-1 max-w-md flex flex-col items-center gap-1">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            className="text-white/60 hover:text-white transition-colors cursor-pointer"
            title="Previous"
          >
            <SkipBack size={16} />
          </button>
          <button
            onClick={onTogglePlay}
            className="w-8 h-8 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center shadow-md shadow-cyan-500/30 transition-all cursor-pointer"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
          <button
            onClick={handleNext}
            className="text-white/60 hover:text-white transition-colors cursor-pointer"
            title="Next"
          >
            <SkipForward size={16} />
          </button>
        </div>

        {/* Progress Scrubber */}
        <div className="w-full flex items-center gap-2 text-[9px] font-mono text-white/40">
          <span>{formatTime(progress)}</span>
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-cyan-400 rounded-full"
              style={{ width: `${(progress / currentTrack.duration) * 100}%` }}
            />
          </div>
          <span>{formatTime(currentTrack.duration)}</span>
        </div>
      </div>

      {/* Right: Sound Wave Visualizer & Status */}
      <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-cyan-400">
        {isPlaying ? (
          <div className="flex items-end gap-0.5 h-4">
            <span className="w-1 bg-cyan-400 h-2 animate-pulse" />
            <span className="w-1 bg-cyan-400 h-4 animate-pulse" style={{ animationDelay: "150ms" }} />
            <span className="w-1 bg-cyan-400 h-3 animate-pulse" style={{ animationDelay: "300ms" }} />
            <span className="w-1 bg-cyan-400 h-1 animate-pulse" style={{ animationDelay: "450ms" }} />
          </div>
        ) : (
          <span className="text-[10px] text-white/30">Paused</span>
        )}
      </div>
    </div>
  );
}
