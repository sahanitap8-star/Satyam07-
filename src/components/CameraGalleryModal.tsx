import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  X,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Download,
  Trash2,
  Share2,
  Eye,
  Zap,
} from "lucide-react";
import { analyzeImageWithAria } from "../services/geminiService";

interface CameraGalleryModalProps {
  isOpen: boolean;
  mode: "camera" | "gallery";
  onClose: () => void;
  onVisionAnalysis: (analysisText: string) => void;
}

export default function CameraGalleryModal({
  isOpen,
  mode: initialMode,
  onClose,
  onVisionAnalysis,
}: CameraGalleryModalProps) {
  const [currentMode, setCurrentMode] = useState<"camera" | "gallery">(initialMode);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60",
  ]);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flashEffect, setFlashEffect] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode]);

  // Start Camera Stream when in camera mode
  useEffect(() => {
    if (isOpen && currentMode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, currentMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera device not accessible in this environment.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn("Camera start err:", err);
      setCameraError(
        "Camera permission was denied or not supported in frame. You can still test AI Vision with Gallery photos!"
      );
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const base64Data = canvas.toDataURL("image/jpeg");

    // Shutter flash effect
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    setCapturedPhotos((prev) => [base64Data, ...prev]);
    setActivePhoto(base64Data);
  };

  const handleAnalyzePhoto = async (photoBase64: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    // Strip prefix if any
    const rawData = photoBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const result = await analyzeImageWithAria(
      rawData,
      "image/jpeg",
      "Observe this image closely. Describe what is happening, identify objects, text, people, code or UI elements in your signature sassy witty Aria persona."
    );

    setIsAnalyzing(false);
    setAnalysisResult(result);
    onVisionAnalysis(result);
  };

  if (!isOpen) return null;

  return (
    <div
      id="camera-gallery-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        className="bg-[#090d18] border border-cyan-500/30 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative"
      >
        {/* Shutter flash animation */}
        {flashEffect && <div className="absolute inset-0 z-40 bg-white animate-fade-out pointer-events-none" />}

        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              {currentMode === "camera" ? <Camera size={18} /> : <ImageIcon size={18} />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {currentMode === "camera" ? "Live Camera & AI Vision" : "Device Photo Gallery"}
              </h2>
              <p className="text-[11px] text-white/50">
                Multimodal Screen & Object Recognition powered by Gemini 3.7
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setCurrentMode("camera")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  currentMode === "camera"
                    ? "bg-cyan-500 text-black font-semibold"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Camera
              </button>
              <button
                onClick={() => setCurrentMode("gallery")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  currentMode === "gallery"
                    ? "bg-cyan-500 text-black font-semibold"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Gallery ({capturedPhotos.length})
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MAIN CAMERA / GALLERY VIEW */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
          {currentMode === "camera" ? (
            <div className="w-full flex flex-col items-center">
              {cameraError ? (
                <div className="w-full h-64 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center p-6 text-center">
                  <Camera className="w-12 h-12 text-white/30 mb-2" />
                  <p className="text-xs text-white/80 max-w-sm mb-4">{cameraError}</p>
                  <button
                    onClick={() => setCurrentMode("gallery")}
                    className="px-4 py-2 bg-cyan-500 text-black text-xs font-bold rounded-xl shadow-lg hover:bg-cyan-400 cursor-pointer"
                  >
                    View Photos & Test AI Vision
                  </button>
                </div>
              ) : (
                <div className="relative w-full aspect-video max-h-[380px] bg-black rounded-2xl overflow-hidden border border-cyan-500/20 shadow-inner">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover mirror"
                  />

                  {/* Viewfinder Overlays */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    LIVE VIEW
                  </div>

                  {/* Center Target Box */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-dashed border-cyan-400/40 rounded-2xl" />
                  </div>
                </div>
              )}

              {/* Camera Shutter Bar */}
              <div className="mt-4 flex items-center justify-center gap-6">
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-600 p-1 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                  title="Capture Picture"
                >
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-cyan-600" />
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* GALLERY VIEW */
            <div className="w-full space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {capturedPhotos.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActivePhoto(img)}
                    className={`aspect-video rounded-xl overflow-hidden border cursor-pointer relative group transition-all ${
                      activePhoto === img
                        ? "border-cyan-400 ring-2 ring-cyan-400/50"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <img src={img} alt="Capture" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                      <span className="text-xs text-white font-medium flex items-center gap-1">
                        <Eye size={14} /> View
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVE PHOTO DETAIL & AI VISION ACTION */}
          {activePhoto && (
            <div className="w-full mt-4 p-4 rounded-2xl bg-white/5 border border-cyan-500/30 flex flex-col md:flex-row items-start gap-4">
              <div className="w-full md:w-48 aspect-video rounded-xl overflow-hidden border border-white/10 shrink-0">
                <img src={activePhoto} alt="Selected" className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 w-full space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    AI Visual Analysis
                  </h4>
                  <button
                    onClick={() => handleAnalyzePhoto(activePhoto)}
                    disabled={isAnalyzing}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:opacity-90 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
                  >
                    <Sparkles size={14} className={isAnalyzing ? "animate-spin" : ""} />
                    <span>{isAnalyzing ? "Aria Analyzing..." : "Ask Aria: What is this?"}</span>
                  </button>
                </div>

                {/* Analysis Box */}
                {analysisResult ? (
                  <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/30 text-xs text-white/90 leading-relaxed font-sans">
                    <p className="font-semibold text-cyan-300 mb-1">Aria Vision Report:</p>
                    <p>{analysisResult}</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-white/50">
                    Tap the button above to let Aria scan the photo using Gemini 3.7 Vision API.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
