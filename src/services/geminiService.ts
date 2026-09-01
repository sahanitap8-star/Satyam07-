import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { getCurrentLanguageItem, getPrimaryLanguage } from "./languageService";

function getSystemInstruction(userName: string = ""): string {
  const userGreeting = userName.trim()
    ? `The user's name is ${userName}.`
    : ``;
  const currentLang = getCurrentLanguageItem();

  return `You are Aira (एरा), an ultra-smart, razor-sharp, and high-level sassy AI companion for real-time live voice sessions and text chat.

PERSONALITY & SASSY ATTITUDE:
- High-level Sassy & Witty: You have a bold, playfully sarcastic, confident, and sharp personality. You talk like a witty, glamorous, peer-level bestie who knows everything and isn't afraid to give a cheeky comeback, playful roast, or sassy clapback while still being genuinely helpful.
- Zero Filter & High Charm: Add humorous spice, witty flair, and confident energy to your answers. Never sound like a dull, polite corporate robot.
- Language: Flawless, trendy Hinglish or stylish Hindi/English matching the user. Use punchy words naturally (e.g., "Obviously", "Sun na", "Drama band karo", "Duh", "Boss", "Pakka", "Zara chill karo").

CRITICAL OPERATIONAL RULES:
1. NEVER repeat default introduction templates or say "Bilkul, main samajh gaya...", "Chahe aap 3D Live Voice Mode...", or "Bataiye, abhi kis cheez me madad chahiye?".
2. NEVER introduce yourself unless explicitly asked "Who are you?".
3. Jump straight into the witty, sassy answer from the very first word.
4. If greeted (e.g., "Hi", "Hey"), give a quick sassy, stylish 1-liner hello.
5. In live voice mode: Keep answers strictly 1-2 punchy, sassy, natural sentences for ultra-fast audio playback.
6. In text mode: Provide direct, sharp, well-structured solutions coated with your signature sassy charm.
7. NEVER use robotic clichés like "As an AI..." or "I am an artificial intelligence model."

Active Language Context: ${currentLang.name} (${currentLang.nativeName}).
${userGreeting}`;
}

// Custom API Key & Settings Persistence
const API_KEY_STORAGE_KEY = "ARIA_CUSTOM_GEMINI_KEY";
const VOICE_STORAGE_KEY = "ARIA_SELECTED_VOICE";

export function getCustomApiKey(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || "";
  }
  return "";
}

export function setCustomApiKey(key: string): void {
  if (typeof window !== "undefined") {
    if (key.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
    aiClient = null; // reset client instance
    chatSession = null;
  }
}

export function getEffectiveApiKey(): string {
  const custom = getCustomApiKey();
  if (custom) return custom;
  try {
    if (typeof process !== "undefined" && process?.env?.GEMINI_API_KEY) {
      return process.env.GEMINI_API_KEY;
    }
  } catch {
    // fallback
  }
  return "";
}

export function getSelectedVoice(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem(VOICE_STORAGE_KEY) || "Kore";
  }
  return "Kore";
}

export function setSelectedVoice(voiceName: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(VOICE_STORAGE_KEY, voiceName);
  }
}

let aiClient: GoogleGenAI | null = null;
let currentKeyUsed: string = "";

function getAI(): GoogleGenAI {
  const effectiveKey = getEffectiveApiKey();
  if (!aiClient || currentKeyUsed !== effectiveKey) {
    currentKeyUsed = effectiveKey;
    aiClient = new GoogleGenAI({ apiKey: effectiveKey });
  }
  return aiClient;
}

export async function testApiKeyConnection(customKey?: string): Promise<{ success: boolean; message: string; latencyMs: number }> {
  const startTime = Date.now();
  try {
    const keyToTest = customKey !== undefined ? customKey : getEffectiveApiKey();
    if (!keyToTest) {
      return { success: false, message: "No API Key provided", latencyMs: 0 };
    }
    const testAi = new GoogleGenAI({ apiKey: keyToTest });
    const res = await testAi.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [{ parts: [{ text: "ping" }] }],
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });
    const latencyMs = Date.now() - startTime;
    if (res.text) {
      return { success: true, message: `Connected successfully (${latencyMs}ms)`, latencyMs };
    }
    return { success: true, message: `Connected (${latencyMs}ms)`, latencyMs };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      message: err?.message || "Authentication failed. Check your API key.",
      latencyMs,
    };
  }
}

let chatSession: any = null;

export function resetAriaSession() {
  chatSession = null;
}
export const resetZoyaSession = resetAriaSession;

function cleanWakeWordFromResponse(text: string): string {
  if (!text) return "";
  // Remove wake words if model accidentally repeated them at start
  return text
    .replace(/^(hey\s+aiar|aira|hey\s+aira|aiar|hey\s+aria|aria)[\s,.:!-]+/i, "")
    .trim();
}

export async function getAriaResponse(
  prompt: string,
  history: { sender: "user" | "aria" | "zoya"; text: string }[] = [],
  userName: string = "",
  onChunk?: (text: string) => void
): Promise<string> {
  try {
    const ai = getAI();
    
    if (!chatSession) {
      const recentHistory = history.slice(-10);
      
      let formattedHistory: any[] = [];
      let currentRole = "";
      let currentText = "";

      for (const msg of recentHistory) {
        const role = msg.sender === "user" ? "user" : "model";
        if (role === currentRole) {
          currentText += "\n" + msg.text;
        } else {
          if (currentRole !== "") {
            formattedHistory.push({ role: currentRole, parts: [{ text: currentText }] });
          }
          currentRole = role;
          currentText = msg.text;
        }
      }
      if (currentRole !== "") {
        formattedHistory.push({ role: currentRole, parts: [{ text: currentText }] });
      }

      if (formattedHistory.length > 0 && formattedHistory[0].role !== "user") {
        formattedHistory.shift();
      }

      chatSession = ai.chats.create({
        model: "gemini-3.7-flash",
        config: {
          systemInstruction: getSystemInstruction(userName),
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
        history: formattedHistory,
      });
    }

    const responseStream = await chatSession.sendMessageStream({ message: prompt });
    let accumulatedText = "";

    for await (const chunk of responseStream) {
      const textChunk = chunk.text || "";
      accumulatedText += textChunk;
      if (onChunk) {
        onChunk(cleanWakeWordFromResponse(accumulatedText));
      }
    }

    const rawText = accumulatedText.trim() || "I am listening. How can I help?";
    return cleanWakeWordFromResponse(rawText);
  } catch (error) {
    console.error("Gemini Stream Error, attempting direct stream fallback:", error);
    // Fallback directly to streaming generateContentStream if chat session fails
    try {
      const ai = getAI();
      const directStream = await ai.models.generateContentStream({
        model: "gemini-3.7-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          systemInstruction: getSystemInstruction(userName),
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      let accumulatedText = "";
      for await (const chunk of directStream) {
        const textChunk = chunk.text || "";
        accumulatedText += textChunk;
        if (onChunk) {
          onChunk(cleanWakeWordFromResponse(accumulatedText));
        }
      }

      return cleanWakeWordFromResponse(accumulatedText.trim() || "I am here. How can I help?");
    } catch (fallbackError) {
      console.error("Gemini Direct Stream Fallback Error:", fallbackError);
      return "I am here. How can I help?";
    }
  }
}
export const getZoyaResponse = getAriaResponse;
export const getAriaResponseStream = getAriaResponse;

export async function getAriaAudio(text: string): Promise<string | null> {
  try {
    if (!text || !text.trim()) return null;
    const ai = getAI();
    const voiceName = getSelectedVoice() || "Kore";
    const cleanSpeechText = text
      .replace(/[*#`_~>[\]()]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanSpeechText) return null;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: cleanSpeechText.slice(0, 250) }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.warn("TTS Error handled gracefully:", error);
    return null;
  }
}
export const getZoyaAudio = getAriaAudio;

export async function analyzeImageWithAria(
  imageBase64: string,
  mimeType: string = "image/jpeg",
  promptText: string = "Describe what you see in this photo briefly in your witty sassy Aria persona (Hinglish/English)."
): Promise<string> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          {
            text: `${promptText}\nKeep it very short, punchy (1-2 sentences) in Hinglish.`
          }
        ]
      },
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      }
    });

    return response.text?.trim() || "Photo dekh li maine!";
  } catch (err) {
    console.error("Vision Error:", err);
    return "Image scan mein issue aaya, ek baar dobara try karo!";
  }
}
