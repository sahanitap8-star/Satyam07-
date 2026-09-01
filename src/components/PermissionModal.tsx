import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MicOff, Mic, CheckCircle2, RefreshCw } from 'lucide-react';
import { MicrophoneManager } from '../services/microphoneManager';

interface Props {
  onClose: () => void;
  onGranted?: () => void;
}

export default function PermissionModal({ onClose, onGranted }: Props) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [granted, setGranted] = useState(false);

  const handleRequestMic = async () => {
    setIsRequesting(true);
    try {
      const success = await MicrophoneManager.requestMicAccess();
      if (success) {
        setGranted(true);
        setTimeout(() => {
          if (onGranted) onGranted();
          onClose();
        }, 1200);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-[#0f111a] border border-white/15 rounded-3xl p-7 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-amber-500" />
        
        <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-5">
          {granted ? (
            <CheckCircle2 size={32} className="text-emerald-400 animate-bounce" />
          ) : (
            <MicOff size={30} className="text-amber-400" />
          )}
        </div>
        
        <h2 className="text-xl font-medium text-white mb-2">
          {granted ? "माइक्रोफ़ोन अनुमति मिल गई!" : "माइक्रोफ़ोन अनुमति आवश्यक (Microphone Required)"}
        </h2>
        <p className="text-white/70 text-xs mb-5 leading-relaxed">
          {granted
            ? "माइक कनेक्ट हो गया है। अब आप Aria से सीधे बात कर सकते हैं।"
            : "Aria की आवाज़ सुनने और बात करने के लिए आपके ब्राउज़र से माइक्रोफ़ोन की अनुमति चाहिए।"}
        </p>

        {!granted && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left w-full mb-6 text-xs text-white/70 space-y-2">
            <p className="font-semibold text-white/90">ब्राउज़र में अनुमति कैसे दें:</p>
            <ol className="list-decimal pl-4 space-y-1 text-white/60">
              <li>नीचे <strong>"माइक्रोफ़ोन चालू करें (Allow Mic)"</strong> बटन दबाएं और ब्राउज़र में <strong>Allow</strong> चुनें।</li>
              <li>यदि पहले ब्लॉक किया था, तो URL बार के पास <strong>🔒 या ⚙️ आइकन</strong> पर क्लिक करके Microphone को <strong>Allow</strong> करें।</li>
            </ol>
          </div>
        )}
        
        <div className="flex flex-col w-full gap-2.5">
          {!granted && (
            <button 
              onClick={handleRequestMic}
              disabled={isRequesting}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isRequesting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>अनुमति जाँची जा रही है...</span>
                </>
              ) : (
                <>
                  <Mic size={16} />
                  <span>माइक्रोफ़ोन चालू करें (Allow Mic)</span>
                </>
              )}
            </button>
          )}

          <button 
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white/90 text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            पेज रीफ्रेश करें (Refresh Page)
          </button>

          <button 
            onClick={onClose}
            className="w-full py-2 px-4 text-white/50 hover:text-white/80 text-xs transition-colors cursor-pointer"
          >
            बंद करें (Close)
          </button>
        </div>
      </motion.div>
    </div>
  );
}
