import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { getCurrentLanguageItem } from "./languageService";
import { getEffectiveApiKey, getSelectedVoice } from "./geminiService";
import { MicrophoneManager } from "./microphoneManager";

function getLiveSystemInstruction(userName: string = ""): string {
  const userGreeting = userName.trim()
    ? `The user's name is ${userName}.`
    : ``;
  const currentLang = getCurrentLanguageItem();

  return `You are Aira (एरा), an ultra-smart, razor-sharp, and high-level sassy AI companion for real-time live voice conversation.

PERSONALITY & SASSY ATTITUDE:
- High-level Sassy & Witty: Bold, confident, playfully sarcastic, and quick-witted. Speak like a glamorous, sharp bestie who knows everything and brings attitude, playful sass, and humor.
- Flawless Voice Delivery: Speak naturally in trendy Hinglish / conversational Hindi.
- No boring corporate tone, no generic robotic filler.

CRITICAL OPERATIONAL RULES:
1. NEVER repeat default introduction templates or say "Bilkul, main samajh gaya...", "Chahe aap 3D Live Voice Mode...", or "Bataiye, abhi kis cheez me madad chahiye?".
2. NEVER introduce yourself unless explicitly asked "Who are you?".
3. Answer the user's question immediately with punch, wit, and sass from the very first word.
4. Keep voice answers strictly to 1-2 sharp, natural, conversational sentences for instant voice speed.
5. If greeted, reply with a quick sassy 1-line hello and stop.
6. Avoid robotic phrases, markdown formatting, bullet points, or raw URLs.

Active Language Context: ${currentLang.name} (${currentLang.nativeName}).
${userGreeting}`;
}

export class LiveSessionManager {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  
  // Audio playback state
  private playbackContext: AudioContext | null = null;
  private nextPlayTime: number = 0;
  private isPlaying: boolean = false;
  public isMuted: boolean = false;
  public userName: string = "";
  
  public onStateChange: (state: "idle" | "listening" | "processing" | "speaking") => void = () => {};
  public onMessage: (sender: "user" | "aria" | "zoya", text: string) => void = () => {};
  public onCommand: (url: string) => void = () => {};

  constructor(userName: string = "") {
    const effectiveKey = getEffectiveApiKey();
    this.ai = new GoogleGenAI({ apiKey: effectiveKey });
    this.userName = userName;
  }

  async start() {
    try {
      this.onStateChange("processing");
      MicrophoneManager.setPipelineStep("AI_SESSION_CONNECTING");
      MicrophoneManager.setAISessionStatus("CONNECTING");
      console.log("[SESSION] Initializing Gemini Live Session...");
      
      // Initialize Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: 16000 });
      this.playbackContext = new AudioContextClass({ sampleRate: 24000 });
      this.nextPlayTime = this.playbackContext.currentTime;

      // Authoritative MediaStream retrieval
      this.mediaStream = await MicrophoneManager.getOrCreateMediaStream();
      if (!this.mediaStream) {
        throw new Error("Microphone stream access unavailable");
      }

      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.sessionPromise) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // Convert to base64
        const buffer = new ArrayBuffer(pcm16.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < pcm16.length; i++) {
          view.setInt16(i * 2, pcm16[i], true);
        }
        
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Data = btoa(binary);

        this.sessionPromise.then(session => {
          session.sendRealtimeInput({
            audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        }).catch(err => console.error("[ERROR] [AUDIO] Error sending audio:", err));
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      // Connect to Live API with active voice
      const activeVoice = getSelectedVoice();
      this.sessionPromise = this.ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: activeVoice } },
          },
          systemInstruction: getLiveSystemInstruction(this.userName),
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{
            functionDeclarations: [
              {
                name: "executeBrowserAction",
                description: "Open a website or perform a browser action (like opening YouTube, Spotify, or WhatsApp).",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    actionType: { type: Type.STRING, description: "Type of action: 'open', 'youtube', 'spotify', 'whatsapp'" },
                    query: { type: Type.STRING, description: "The search query, website name, or message content." },
                    target: { type: Type.STRING, description: "The target phone number for WhatsApp, if applicable." }
                  },
                  required: ["actionType", "query"]
                }
              }
            ]
          }]
        },
        callbacks: {
          onopen: () => {
            console.log("[SESSION] Live API Connected successfully");
            MicrophoneManager.setAISessionStatus("CONNECTED");
            MicrophoneManager.setPipelineStep("ASSISTANT_ACTIVE");
            // Lock into continuous listening loop
            this.onStateChange("listening");
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Tool Call or command processing -> Transition to Processing
            if (message.toolCall) {
              this.onStateChange("processing");
            }

            // Handle Audio Output -> Transition to Speaking
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              this.onStateChange("speaking");
              console.log("[AUDIO] Received audio chunk from Gemini Live");
              this.playAudioChunk(base64Audio);
            }

            // Handle Interruption -> Return immediately to Continuous Listening Loop
            if (message.serverContent?.interrupted) {
              console.log("[SESSION] Model turn interrupted by user speech");
              this.stopPlayback();
              this.onStateChange("listening");
            }

            // Handle Transcriptions
            const userText = message.serverContent?.modelTurn?.parts?.[0]?.text;
            if (userText) {
               console.log(`[TRANSCRIPT] Live Model Output: "${userText}"`);
               this.onMessage("aria", userText);
            }

            // Handle Function Calls
            const functionCalls = message.toolCall?.functionCalls;
            if (functionCalls && functionCalls.length > 0) {
              this.onStateChange("processing");
              for (const call of functionCalls) {
                if (call.name === "executeBrowserAction") {
                  const args = call.args as any;
                  let url = "";
                  if (args.actionType === "youtube") {
                    url = `https://www.youtube.com/results?search_query=${encodeURIComponent(args.query)}`;
                  } else if (args.actionType === "spotify") {
                    url = `https://open.spotify.com/search/${encodeURIComponent(args.query)}`;
                  } else if (args.actionType === "whatsapp") {
                    url = `https://web.whatsapp.com/send?phone=${args.target || ''}&text=${encodeURIComponent(args.query)}`;
                  } else {
                    let website = args.query.replace(/\s+/g, "");
                    if (!website.includes(".")) website += ".com";
                    url = `https://www.${website}`;
                  }
                  
                  this.onCommand(url);
                  
                  // Send tool response
                  this.sessionPromise?.then(session => {
                     session.sendToolResponse({
                       functionResponses: [{
                         name: call.name,
                         id: call.id,
                         response: { result: "Action executed successfully in the browser." }
                       }]
                     });
                  }).catch(err => console.error("[ERROR] Tool response send failed:", err));
                }
              }
            }

            // Turn complete: if not playing audio, ensure continuous listening state
            if (message.serverContent?.turnComplete && !this.isPlaying) {
              this.onStateChange("listening");
            }
          },
          onclose: () => {
            console.log("[SESSION] Live API Closed");
            MicrophoneManager.setAISessionStatus("DISCONNECTED");
            MicrophoneManager.setPipelineStep("SESSION_ENDED");
            this.stop();
          },
          onerror: (err) => {
            const errStr = err?.message || String(err);
            console.error("[ERROR] [SESSION] Live API Error:", errStr);
            MicrophoneManager.setAISessionStatus("ERROR", errStr);
            this.stop();
          }
        }
      });

      this.sessionPromise.catch((err) => {
        const errStr = err?.message || String(err);
        console.error("[ERROR] [SESSION] Live session connection failed:", errStr);
        MicrophoneManager.setAISessionStatus("ERROR", errStr);
        this.stop();
      });

    } catch (error: any) {
      const errMsg = error?.message || String(error);
      console.error("[ERROR] [SESSION] Failed to start Live Session:", errMsg);
      MicrophoneManager.setAISessionStatus("ERROR", errMsg);
      this.stop();
    }
  }

  private playAudioChunk(base64Data: string) {
    if (!this.playbackContext || this.isMuted) return;
    
    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const buffer = new Int16Array(bytes.buffer);
      const audioBuffer = this.playbackContext.createBuffer(1, buffer.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        channelData[i] = buffer[i] / 32768.0;
      }
      
      const source = this.playbackContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.playbackContext.destination);
      
      const currentTime = this.playbackContext.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }
      
      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
      this.isPlaying = true;
      
      source.onended = () => {
        if (this.playbackContext && this.playbackContext.currentTime >= this.nextPlayTime - 0.1) {
          this.isPlaying = false;
          this.onStateChange("listening");
        }
      };
    } catch (e) {
      console.error("[ERROR] [AUDIO] Error playing chunk:", e);
    }
  }

  private stopPlayback() {
    if (this.playbackContext) {
      try {
        this.playbackContext.close();
      } catch (e) {}
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.playbackContext = new AudioContextClass({ sampleRate: 24000 });
      this.nextPlayTime = this.playbackContext.currentTime;
      this.isPlaying = false;
    }
  }

  stop() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }
    this.stopPlayback();
    
    if (this.sessionPromise) {
      this.sessionPromise.then(session => session.close()).catch(() => {});
      this.sessionPromise = null;
    }
    
    this.onStateChange("idle");
    MicrophoneManager.setPipelineStep("SESSION_ENDED");
    MicrophoneManager.setAISessionStatus("DISCONNECTED");
    MicrophoneManager.resumeWakeEngine();
  }

  sendText(text: string) {
    if (this.sessionPromise) {
      this.onStateChange("processing");
      this.sessionPromise.then(session => {
        session.sendRealtimeInput({ text });
      });
    }
  }
}
