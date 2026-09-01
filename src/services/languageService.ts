// Complete Multi-Language & Hindi Voice Architecture for Aria
// Supports all Indian languages, Global languages, and dialect/script variations.

export interface LanguageItem {
  code: string;
  name: string;
  nativeName: string;
  speechCode: string; // BCP 47 language tag for Web Speech API & TTS
  category: "indian" | "global" | "regional";
  flag: string;
  greetingText: string;
  samplePrompt: string;
}

export const SUPPORTED_LANGUAGES: LanguageItem[] = [
  // Indian Languages
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिंदी (Default)",
    speechCode: "hi-IN",
    category: "indian",
    flag: "🇮🇳",
    greetingText: "नमस्ते! मैं आपकी स्मार्ट और सैसी वॉइस असिस्टेंट आइरा हूँ। बताइए आज क्या करना है?",
    samplePrompt: "हे आइरा, फ्लैशलाइट चालू करो",
  },
  {
    code: "hinglish",
    name: "Hinglish",
    nativeName: "Hinglish (Hindi in English Script)",
    speechCode: "en-IN",
    category: "indian",
    flag: "🇮🇳",
    greetingText: "Hey there! Main aapki sassy assistant Aria hoon. Boliye aaj kya dhamaka karna hai?",
    samplePrompt: "Hey Aiar flashlight on karo",
  },
  {
    code: "en",
    name: "English",
    nativeName: "English (Indian / Global)",
    speechCode: "en-IN",
    category: "global",
    flag: "🌐",
    greetingText: "Hello! I'm Aria, your quick-witted sassy AI companion. What's on your mind?",
    samplePrompt: "Hey Aiar what's the weather today?",
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    speechCode: "bn-IN",
    category: "indian",
    flag: "🇮🇳",
    greetingText: "নমস্কার! আমি আরিয়া, আপনার ভয়েস অ্যাসিস্ট্যান্ট। বলুন আমি কীভাবে সাহায্য করতে পারি?",
    samplePrompt: "হে আরিয়া, সময় কত?",
  },
  {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    speechCode: "mr-IN",
    category: "indian",
    flag: "🇮🇳",
    greetingText: "नमस्कार! मी आर्या, तुमची व्हॉइस असिस्टंट. सांगा, आज मी काय मदत करू?",
    samplePrompt: "हे आर्या, टॉर्च चालू कर",
  },
  {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    speechCode: "te-IN",
    category: "indian",
    flag: "🇮🇳",
    greetingText: "నమస్కారం! నేను ఆరియా, మీ వాయిస్ అసిస్టెంట్. నేను మీకు ఎలా సహాయపడగలను?",
    samplePrompt: "హే ఆరియా, సమయం ఎంత?",
  },
  {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    speechCode: "ta-IN",
    category: "indian",
    flag: "🇮🇳",
    greetingText: "வணக்கம்! நான் ஆரியா, உங்கள் குரல் உதவியாளர். உங்களுக்கு நான் எவ்வாறு உதவ முடியும்?",
    samplePrompt: "ஹே ஆரியா, நேரம் என்ன?",
  },
  {
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    speechCode: "gu-IN",
    category: "indian",
    flag: "🇮🇳",
    greetingText: "નમસ્તે! હું આર્યા છું, તમારી સ્માર્ટ વૉઇસ આસિસ્ટન્ટ. બોલો, આજે શું મદદ કરું?",
    samplePrompt: "હે આર્યા, ફ્લેશલાઇટ ચાલુ કરો",
  },
  {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    speechCode: "ur-IN",
    category: "indian",
    flag: "🇮🇳",
    greetingText: "السلام علیکم! میں آریا ہوں، آپ کی وائس اسسٹنٹ۔ فرمائیے میں آپ کی کیا مدد کر سکتی ہوں؟",
    samplePrompt: "اے آریا، وقت کیا ہوا ہے؟",
  },
  {
    code: "kn",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    speechCode: "kn-IN",
    category: "indian",
    flag: "🇮🇳",
    greetingText: "ನಮಸ್ಕಾರ! ನಾನು ಆರ್ಯಾ, ನಿಮ್ಮ ವಾಯ್ಸ್ ಅಸಿಸ್ಟೆಂಟ್. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
    samplePrompt: "ಹೇ ಆರ್ಯಾ, ಸಮಯ ಎಷ್ಟು?",
  },
  {
    code: "ml",
    name: "Malayalam",
    nativeName: "മലയാളം",
    speechCode: "ml-IN",
    category: "indian",
    flag: "🇮🇳",
    greetingText: "നമസ്കാരം! ഞാൻ ആര്യ, നിങ്ങളുടെ വോയ്‌സ് അസിസ്റ്റന്റ്. ഇന്ന് ഞാൻ എന്താണ് ചെയ്യേണ്ടത്?",
    samplePrompt: "ഹേ ആര്യ, സമയം എത്രയായി?",
  },
  {
    code: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    speechCode: "pa-IN",
    category: "indian",
    flag: "🇮🇳",
    greetingText: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਆਰੀਆ ਹਾਂ, ਤੁਹਾਡੀ ਵੌਇਸ ਅਸਿਸਟੈਂਟ। ਦੱਸੋ ਅੱਜ ਕੀ ਹੁਕਮ ਹੈ?",
    samplePrompt: "ਹੇ ਆਰੀਆ, ਟਾਈਮ ਕੀ ਹੋਇਆ ਹੈ?",
  },
  {
    code: "or",
    name: "Odia",
    nativeName: "ଓଡ଼ିଆ",
    speechCode: "or-IN",
    category: "indian",
    flag: "🇮🇳",
    greetingText: "ନମସ୍କାର! ମୁଁ ଆରିଆ, ଆପଣଙ୍କର ଭଏସ୍ ଆସିଷ୍ଟାଣ୍ଟ। କୁହନ୍ତୁ ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିବି?",
    samplePrompt: "ହେ ଆରିଆ, ଫ୍ଲାସଲାଇଟ ଅନ୍ କର",
  },
  {
    code: "as",
    name: "Assamese",
    nativeName: "অসমীয়া",
    speechCode: "as-IN",
    category: "indian",
    flag: "🇮🇳",
    greetingText: "নমস্কাৰ! মই আৰিয়া, আপোনাৰ ভয়েচ সহায়ক। কওক আজি মই কি সহায় কৰিব পাৰো?",
    samplePrompt: "হে আৰিয়া, সময় কিমান হ'ল?",
  },
  {
    code: "bho",
    name: "Bhojpuri",
    nativeName: "भोजपुरी",
    speechCode: "hi-IN",
    category: "regional",
    flag: "🇮🇳",
    greetingText: "प्रणाम! हम आइरा हईं, रउवा स्मार्ट वॉयस असिस्टेंट। बताईं आज का हुकुम बा?",
    samplePrompt: "हे आइरा, टॉर्च जरा द",
  },
  {
    code: "sa",
    name: "Sanskrit",
    nativeName: "संस्कृतम्",
    speechCode: "hi-IN",
    category: "regional",
    flag: "🇮🇳",
    greetingText: "नमो नमः! अहम् आर्या अस्मि, भवतः ध्वनि-सहायिका। कथम् अहम् भवतः साहाय्यं कुर्याम्?",
    samplePrompt: "हे आर्या, समयः कः?",
  },

  // Global Languages
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    speechCode: "es-ES",
    category: "global",
    flag: "🇪🇸",
    greetingText: "¡Hola! Soy Aria, tu asistente de voz con estilo y actitud. ¿En qué te puedo ayudar hoy?",
    samplePrompt: "Hola Aria, ¿qué hora es?",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    speechCode: "fr-FR",
    category: "global",
    flag: "🇫🇷",
    greetingText: "Bonjour ! Je suis Aria, votre assistante vocale intelligente et pleine d'esprit. Que puis-je faire pour vous ?",
    samplePrompt: "Hé Aria, quelle heure est-il ?",
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    speechCode: "de-DE",
    category: "global",
    flag: "🇩🇪",
    greetingText: "Hallo! Ich bin Aria, deine schlagfertige KI-Assistentin. Wie kann ich dir heute helfen?",
    samplePrompt: "Hey Aria, wie spät ist es?",
  },
  {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    speechCode: "ja-JP",
    category: "global",
    flag: "🇯🇵",
    greetingText: "こんにちは！スマートな音声アシスタントのアリアです。何かお手伝いしましょうか？",
    samplePrompt: "ヘイ アリア、今何時？",
  },
  {
    code: "ko",
    name: "Korean",
    nativeName: "한국어",
    speechCode: "ko-KR",
    category: "global",
    flag: "🇰🇷",
    greetingText: "안녕하세요! 저는 당신의 스마트하고 재치 있는 음성 비서 아리아입니다. 무엇을 도와드릴까요?",
    samplePrompt: "헤이 아리아, 지금 몇 시야?",
  },
  {
    code: "zh",
    name: "Mandarin Chinese",
    nativeName: "中文",
    speechCode: "zh-CN",
    category: "global",
    flag: "🇨🇳",
    greetingText: "你好！我是你的智能语音助手 Aria。今天有什么我可以帮你的？",
    samplePrompt: "嘿 Aria，现在几点了？",
  },
  {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    speechCode: "ar-SA",
    category: "global",
    flag: "🇸🇦",
    greetingText: "مرحبًا! أنا آريا، مساعدتك الصوتية الذكية. كيف يمكنني مساعدتك اليوم؟",
    samplePrompt: "مرحبا آريا، كم الساعة الآن؟",
  },
  {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    speechCode: "ru-RU",
    category: "global",
    flag: "🇷🇺",
    greetingText: "Привет! Я Ария, ваш умный голосовой помощник. Чем могу помочь?",
    samplePrompt: "Эй Ария, который час?",
  },
  {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    speechCode: "pt-BR",
    category: "global",
    flag: "🇧🇷",
    greetingText: "Olá! Eu sou a Aria, sua assistente de voz inteligente e cheia de estilo. Como posso ajudar?",
    samplePrompt: "Ei Aria, que horas são?",
  },
  {
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    speechCode: "it-IT",
    category: "global",
    flag: "🇮🇹",
    greetingText: "Ciao! Sono Aria, la tua assistente vocale brillante e spiritosa. Cosa posso fare per te?",
    samplePrompt: "Ehi Aria, che ore sono?",
  },
  {
    code: "tr",
    name: "Turkish",
    nativeName: "Türkçe",
    speechCode: "tr-TR",
    category: "global",
    flag: "🇹🇷",
    greetingText: "Merhaba! Ben Aria, akıllı ve esprili sesli asistanınız. Bugün size nasıl yardımcı olabilirim?",
    samplePrompt: "Hey Aria, saat kaç?",
  },
  {
    code: "id",
    name: "Indonesian",
    nativeName: "Bahasa Indonesia",
    speechCode: "id-ID",
    category: "global",
    flag: "🇮🇩",
    greetingText: "Halo! Saya Aria, asisten suara pintar Anda. Ada yang bisa saya bantu hari ini?",
    samplePrompt: "Hai Aria, jam berapa sekarang?",
  },
  {
    code: "ne",
    name: "Nepali",
    nativeName: "नेपाली",
    speechCode: "ne-NP",
    category: "regional",
    flag: "🇳🇵",
    greetingText: "नमस्ते! म आरिया हुँ, तपाईंको स्मार्ट भ्वाइस सहायक। म तपाईंलाई कसरी मद्दत गर्न सक्छु?",
    samplePrompt: "हे आरिया, कति बज्यो?",
  },
];

const LANGUAGE_STORAGE_KEY = "ARIA_PRIMARY_LANGUAGE";

/**
 * Get current primary language (defaults to "hi" - Hindi)
 */
export function getPrimaryLanguage(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      return saved;
    }
  }
  return "hi"; // Default to Hindi
}

/**
 * Set primary language
 */
export function setPrimaryLanguage(code: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  }
}

/**
 * Get current LanguageItem object
 */
export function getCurrentLanguageItem(): LanguageItem {
  const code = getPrimaryLanguage();
  return (
    SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0]
  );
}

/**
 * Get Speech Recognition code for Web Speech API
 */
export function getSpeechRecognitionLanguage(): string {
  const lang = getCurrentLanguageItem();
  return lang.speechCode;
}
