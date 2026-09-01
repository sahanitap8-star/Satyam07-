import { SystemSettings, Contact, SMSMessage, NotificationItem, FileItem } from "../types/device";

export interface CommandResult {
  handled: boolean;
  action: string;
  category: "apps" | "calls" | "sms" | "notifications" | "system" | "browser" | "files" | "camera" | "media" | "security" | "architecture" | "automation" | "chat";
  url?: string;
  isBrowserAction?: boolean;
  systemUpdate?: Partial<SystemSettings>;
  openModal?: "apps" | "dialer" | "sms" | "notifications" | "system" | "browser" | "files" | "camera" | "gallery" | "architecture" | "recents";
  callTarget?: { name: string; phone: string };
  smsTarget?: { phone: string; text: string; recipientName?: string };
  browserTarget?: { url: string; query?: string };
  mediaAction?: "play" | "pause" | "next" | "prev" | "toggle";
  securityPrompt?: { title: string; risk: string; actionToPerform: string };
  automationStep?: {
    type: "tap" | "swipe" | "scroll" | "type" | "back" | "home" | "recents";
    target?: string;
    value?: string;
  };
}

export function processCommand(
  rawCommand: string,
  currentSettings?: SystemSettings,
  contacts: Contact[] = [],
  userName: string = ""
): CommandResult {
  // Strip trigger words at start if present (handles English, Hinglish, and Hindi Devanagari)
  let cleanInput = rawCommand.trim();
  const hindiTriggerMatch = cleanInput.match(/^(?:हे\s+आइरा|आइरा|हे\s+आयर|आयर|हे\s+अरिया|अरिया|हे\s+ऐरा|ऐरा|सुनो\s+आइरा|सुनो\s+अरिया|नमस्ते\s+आइरा)[\s,.:!?-]*/i);
  if (hindiTriggerMatch) {
    cleanInput = cleanInput.substring(hindiTriggerMatch[0].length).trim();
  } else {
    const triggerMatch = cleanInput.match(/^(?:ok|hello|hi|listen|sun|suno)?\s*(hey\s+(?:aiar|aira|aria|aya|ayar|ire|ir|ai|aiyar|ayra|era|ira|iyar)|aiar|aira|aria|aiyar|ayar|ayra|era|ira|iyar)[\s,.:!?-]*/i);
    if (triggerMatch) {
      cleanInput = cleanInput.substring(triggerMatch[0].length).trim();
    }
  }

  const cmd = (cleanInput || rawCommand).toLowerCase().trim();
  const displayName = userName ? userName : "Satyam";

  // If user just said the wake word
  if (!cleanInput) {
    return {
      handled: true,
      category: "chat",
      action: `हाँ जी ${displayName}! मैं सुन रही हूँ, बताइए क्या हुक्म है?`,
    };
  }

  // 1. SECURITY BOUNDARY CHECKS (Must NOT bypass security/banking/pin/biometrics)
  if (
    cmd.includes("bypass pin") ||
    cmd.includes("bypass password") ||
    cmd.includes("bypass biometric") ||
    cmd.includes("hack bank") ||
    cmd.includes("send upi money") ||
    cmd.includes("transfer money") ||
    cmd.includes("factory reset without permission") ||
    cmd.includes("delete all system files")
  ) {
    return {
      handled: true,
      category: "security",
      action: `I cannot perform banking transfers, PIN bypasses, or destructive system operations due to security policies.`,
      securityPrompt: {
        title: "Security Boundary Protection",
        risk: "Unauthorized PIN/Biometric or Banking Operation",
        actionToPerform: "Blocked by Safety Protocol",
      },
    };
  }

  // 2. SYSTEM CONTROLS
  // Flashlight / Torch
  if (
    cmd.includes("flashlight on") ||
    cmd.includes("torch on") ||
    cmd.includes("turn on flashlight") ||
    cmd.includes("light on") ||
    cmd.includes("torch chalu") ||
    cmd.includes("फ्लैशलाइट चालू") ||
    cmd.includes("फ्लैशलाइट ऑन") ||
    cmd.includes("टॉर्च चालू") ||
    cmd.includes("टॉर्च ऑन") ||
    cmd.includes("टॉर्च जलाओ") ||
    cmd.includes("लाइट चालू")
  ) {
    return {
      handled: true,
      category: "system",
      action: `फ्लैशलाइट ऑन कर दी है, ${displayName}! अब थोड़ा अंधेरा कम होगा।`,
      systemUpdate: { flashlight: true },
    };
  }
  if (
    cmd.includes("flashlight off") ||
    cmd.includes("torch off") ||
    cmd.includes("turn off flashlight") ||
    cmd.includes("light off") ||
    cmd.includes("torch band") ||
    cmd.includes("फ्लैशलाइट बंद") ||
    cmd.includes("टॉर्च बंद") ||
    cmd.includes("लाइट बंद")
  ) {
    return {
      handled: true,
      category: "system",
      action: `फ्लैशलाइट बंद कर दी है, ${displayName}।`,
      systemUpdate: { flashlight: false },
    };
  }

  // Volume Controls
  if (
    cmd.includes("volume full") ||
    cmd.includes("volume 100") ||
    cmd.includes("max volume") ||
    cmd.includes("aawaz full") ||
    cmd.includes("वॉल्यूम फुल") ||
    cmd.includes("आवाज फुल") ||
    cmd.includes("आवाज़ पूरी करो")
  ) {
    return {
      handled: true,
      category: "system",
      action: `वॉल्यूम 100% फुल कर दी है! अब आवाज़ एकदम साफ़ और तेज़ आएगी।`,
      systemUpdate: { volume: 100, ringVolume: 100, soundMode: "sound" },
    };
  }
  if (
    cmd.includes("mute") ||
    cmd.includes("silent mode") ||
    cmd.includes("volume zero") ||
    cmd.includes("aawaz band") ||
    cmd.includes("साइलेंट") ||
    cmd.includes("म्यूट") ||
    cmd.includes("आवाज बंद")
  ) {
    return {
      handled: true,
      category: "system",
      action: `फ़ोन को साइलेंट मोड पर डाल दिया है। शांति ही शांति!`,
      systemUpdate: { volume: 0, ringVolume: 0, soundMode: "silent" },
    };
  }
  if (
    cmd.includes("vibrate mode") ||
    cmd.includes("vibration on") ||
    cmd.includes("phone vibrate") ||
    cmd.includes("वाइब्रेट") ||
    cmd.includes("कंपन")
  ) {
    return {
      handled: true,
      category: "system",
      action: `फ़ोन को वाइब्रेशन मोड पर सेट कर दिया है।`,
      systemUpdate: { soundMode: "vibrate" },
    };
  }
  if (
    cmd.includes("volume up") ||
    cmd.includes("increase volume") ||
    cmd.includes("aawaz badhao") ||
    cmd.includes("वॉल्यूम बढ़ाओ") ||
    cmd.includes("आवाज बढ़ाओ") ||
    cmd.includes("आवाज़ तेज़ करो")
  ) {
    const newVol = Math.min(100, (currentSettings?.volume ?? 70) + 20);
    return {
      handled: true,
      category: "system",
      action: `वॉल्यूम बढ़ा कर ${newVol}% कर दी है।`,
      systemUpdate: { volume: newVol, ringVolume: newVol, soundMode: "sound" },
    };
  }
  if (
    cmd.includes("volume down") ||
    cmd.includes("decrease volume") ||
    cmd.includes("aawaz kam karo") ||
    cmd.includes("वॉल्यूम कम करो") ||
    cmd.includes("आवाज कम करो") ||
    cmd.includes("धीमी करो")
  ) {
    const newVol = Math.max(0, (currentSettings?.volume ?? 70) - 20);
    return {
      handled: true,
      category: "system",
      action: `वॉल्यूम कम करके ${newVol}% कर दी है।`,
      systemUpdate: { volume: newVol, ringVolume: newVol },
    };
  }

  // Brightness Controls
  if (
    cmd.includes("brightness full") ||
    cmd.includes("brightness 100") ||
    cmd.includes("max brightness") ||
    cmd.includes("ब्राइटनेस फुल") ||
    cmd.includes("रोशनी फुल")
  ) {
    return {
      handled: true,
      category: "system",
      action: `स्क्रीन ब्राइटनेस पूरी 100% कर दी है!`,
      systemUpdate: { brightness: 100 },
    };
  }
  if (
    cmd.includes("brightness low") ||
    cmd.includes("dim screen") ||
    cmd.includes("brightness kam") ||
    cmd.includes("ब्राइटनेस कम") ||
    cmd.includes("रोशनी कम")
  ) {
    return {
      handled: true,
      category: "system",
      action: `स्क्रीन की ब्राइटनेस कम करके 25% कर दी है।`,
      systemUpdate: { brightness: 25 },
    };
  }
  if (
    cmd.includes("brightness up") ||
    cmd.includes("increase brightness") ||
    cmd.includes("brightness badhao") ||
    cmd.includes("ब्राइटनेस बढ़ाओ")
  ) {
    const newB = Math.min(100, (currentSettings?.brightness ?? 60) + 20);
    return {
      handled: true,
      category: "system",
      action: `ब्राइटनेस बढ़ा कर ${newB}% कर दी।`,
      systemUpdate: { brightness: newB },
    };
  }

  // Wi-Fi / Bluetooth / DND / Hotspot
  if (
    cmd.includes("wifi on") ||
    cmd.includes("turn on wifi") ||
    cmd.includes("connect wifi") ||
    cmd.includes("वाईफाई ऑन") ||
    cmd.includes("वाईफाई चालू")
  ) {
    return {
      handled: true,
      category: "system",
      action: `Wi-Fi चालू कर दिया है!`,
      systemUpdate: { wifi: true },
    };
  }
  if (
    cmd.includes("wifi off") ||
    cmd.includes("turn off wifi") ||
    cmd.includes("disconnect wifi") ||
    cmd.includes("वाईफाई बंद")
  ) {
    return {
      handled: true,
      category: "system",
      action: `Wi-Fi बंद कर दिया है।`,
      systemUpdate: { wifi: false },
    };
  }
  if (
    cmd.includes("bluetooth on") ||
    cmd.includes("turn on bluetooth") ||
    cmd.includes("ब्लूटूथ ऑन") ||
    cmd.includes("ब्लूटूथ चालू")
  ) {
    return {
      handled: true,
      category: "system",
      action: `ब्लूटूथ चालू कर दिया है। कनेक्ट करने के लिए तैयार!`,
      systemUpdate: { bluetooth: true },
    };
  }
  if (
    cmd.includes("bluetooth off") ||
    cmd.includes("turn off bluetooth") ||
    cmd.includes("ब्लूटूथ बंद")
  ) {
    return {
      handled: true,
      category: "system",
      action: `ब्लूटूथ बंद कर दिया गया है।`,
      systemUpdate: { bluetooth: false },
    };
  }
  if (
    cmd.includes("dnd on") ||
    cmd.includes("do not disturb on") ||
    cmd.includes("dnd mode") ||
    cmd.includes("डीएनडी ऑन")
  ) {
    return {
      handled: true,
      category: "system",
      action: `डू नॉट डिस्टर्ब (DND) चालू कर दिया है। अब कोई डिस्टर्ब नहीं करेगा!`,
      systemUpdate: { dnd: true },
    };
  }
  if (
    cmd.includes("dnd off") ||
    cmd.includes("do not disturb off") ||
    cmd.includes("डीएनडी बंद")
  ) {
    return {
      handled: true,
      category: "system",
      action: `डू नॉट डिस्टर्ब बंद कर दिया है।`,
      systemUpdate: { dnd: false },
    };
  }
  if (
    cmd.includes("battery status") ||
    cmd.includes("battery kitni hai") ||
    cmd.includes("check battery") ||
    cmd.includes("बैटरी कितनी है") ||
    cmd.includes("बैटरी चेक करो") ||
    cmd.includes("बैटरी का हाल")
  ) {
    const level = currentSettings?.batteryLevel ?? 85;
    const isCharging = currentSettings?.isCharging ?? false;
    return {
      handled: true,
      category: "system",
      action: `बैटरी ${level}% है${isCharging ? " और फ़ोन चार्ज हो रहा है" : ""}। बैटरी की सेहत एकदम मस्त है!`,
    };
  }
  if (
    cmd.includes("open settings") ||
    cmd.includes("system settings") ||
    cmd.includes("control center") ||
    cmd.includes("सेटिंग्स खोलो") ||
    cmd.includes("सेटिंग खोलो")
  ) {
    return {
      handled: true,
      category: "system",
      action: `सिस्टम सेटिंग्स और कंट्रोल सेंटर खोल दिया है।`,
      openModal: "system",
    };
  }

  // 3. CALLS & CONTACTS
  const callMatch = cmd.match(/(?:call|dial|phone lagao|call karo|कॉल करो|फ़ोन लगाओ|फोन करो|कॉल लगाओ)\s+(.+)/);
  if (callMatch) {
    const target = callMatch[1].trim().replace(/\bto\b/g, "").trim();
    // Check if target is in contacts
    const matchedContact = contacts.find(
      (c) => c.name.toLowerCase().includes(target) || c.phone.includes(target)
    );

    if (matchedContact) {
      return {
        handled: true,
        category: "calls",
        action: `${matchedContact.name} को कॉल लगाई जा रही है (${matchedContact.phone})। फ़ोन उठते ही बात शुरू कीजिये!`,
        openModal: "dialer",
        callTarget: { name: matchedContact.name, phone: matchedContact.phone },
      };
    } else {
      const isDigitsOnly = /^[0-9+\s]+$/.test(target);
      const phoneNum = isDigitsOnly ? target.replace(/\s+/g, "") : "9876543210";
      return {
        handled: true,
        category: "calls",
        action: `${target} पर कॉल कनेक्ट की जा रही है...`,
        openModal: "dialer",
        callTarget: { name: target, phone: phoneNum },
      };
    }
  }

  if (
    cmd.includes("open dialer") ||
    cmd.includes("open contacts") ||
    cmd.includes("phone app") ||
    cmd.includes("call list") ||
    cmd.includes("डायलर खोलो") ||
    cmd.includes("कॉन्टैक्ट खोलो") ||
    cmd.includes("फोन ऐप")
  ) {
    return {
      handled: true,
      category: "calls",
      action: `कॉन्टैक्ट्स और डायलर पैड खोल दिया है। किसको कॉल लगाना है?`,
      openModal: "dialer",
    };
  }

  // 4. SMS / MESSAGING & WHATSAPP
  const waMatch = cmd.match(/(?:send\s+(?:a\s+)?whatsapp(?:\s+message)?\s+to\s+|व्हाट्सएप\s+भेजो\s+)([\d\+\s\w]+)(?:\s+saying|\s+with\s+message|\s+likho|\s+bolo|\s+मैसेज)?\s*(.*)/);
  if (waMatch) {
    const recipient = waMatch[1].trim();
    const msgBody = waMatch[2]?.trim() || "नमस्ते Aria की तरफ से!";
    const isDigits = /^[0-9+]+$/.test(recipient.replace(/\s+/g, ""));
    const phone = isDigits ? recipient.replace(/\s+/g, "") : "919876543210";
    return {
      handled: true,
      category: "sms",
      action: `व्हाट्सएप पर ${recipient} को मैसेज भेजा जा रहा है: "${msgBody}"।`,
      url: `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msgBody)}`,
      isBrowserAction: true,
      smsTarget: { phone, text: msgBody, recipientName: recipient },
    };
  }

  const smsMatch = cmd.match(/(?:send\s+(?:an?\s+)?sms|message\s+bhejo|text\s+karo|मैसेज\s+भेजो|एसएमएस\s+भेजो)\s+(?:to\s+)?([\d\+\s\w]+)(?:\s+saying|\s+that|\s+likho|\s+लिखो)?\s*(.*)/);
  if (smsMatch) {
    const recipient = smsMatch[1].trim();
    const msgBody = smsMatch[2]?.trim() || "Hello from Aria Assistant!";
    return {
      handled: true,
      category: "sms",
      action: `SMS कम्पोज़ करके ${recipient} के लिए तैयार कर दिया: "${msgBody}"।`,
      openModal: "sms",
      smsTarget: { phone: recipient, text: msgBody, recipientName: recipient },
    };
  }

  if (
    cmd.includes("open sms") ||
    cmd.includes("open messages") ||
    cmd.includes("inbox") ||
    cmd.includes("message app") ||
    cmd.includes("मैसेज खोलो") ||
    cmd.includes("एसएमएस खोलो")
  ) {
    return {
      handled: true,
      category: "sms",
      action: `मैसेजेस ऐप खोल दिया है। यहाँ आपके सभी SMS और ड्राफ्ट्स हैं।`,
      openModal: "sms",
    };
  }

  // 5. NOTIFICATIONS
  if (
    cmd.includes("read notification") ||
    cmd.includes("check notification") ||
    cmd.includes("notification padho") ||
    cmd.includes("open notification") ||
    cmd.includes("notification shade") ||
    cmd.includes("नोटिफिकेशन पढ़ो") ||
    cmd.includes("नोटिफिकेशन खोलो") ||
    cmd.includes("नोटिफिकेशन दिखाओ")
  ) {
    return {
      handled: true,
      category: "notifications",
      action: `नोटिफिकेशन पैनल खोल दिया है! आपके नए अलर्ट्स और नोटिफिकेशन्स यहाँ हैं।`,
      openModal: "notifications",
    };
  }
  if (
    cmd.includes("clear notification") ||
    cmd.includes("dismiss notification") ||
    cmd.includes("clear all notifications") ||
    cmd.includes("नोटिफिकेशन हटाओ") ||
    cmd.includes("नोटिफिकेशन साफ करो")
  ) {
    return {
      handled: true,
      category: "notifications",
      action: `सभी नोटिफिकेशन्स साफ़ कर दी हैं। स्क्रीन एकदम क्लीन!`,
      openModal: "notifications",
    };
  }

  // 6. CAMERA & GALLERY & VISION
  if (
    cmd.includes("open camera") ||
    cmd.includes("take photo") ||
    cmd.includes("photo khicho") ||
    cmd.includes("click picture") ||
    cmd.includes("camera chalu karo") ||
    cmd.includes("कैमरा खोलो") ||
    cmd.includes("कैमरा चालू") ||
    cmd.includes("फोटो खींचो") ||
    cmd.includes("तस्वीर खींचो")
  ) {
    return {
      handled: true,
      category: "camera",
      action: `लाइव कैमरा व्यूफाइंडर चालू कर दिया है। स्माइल कीजिये ${displayName}!`,
      openModal: "camera",
    };
  }
  if (
    cmd.includes("open gallery") ||
    cmd.includes("show photos") ||
    cmd.includes("meri photos dikhao") ||
    cmd.includes("photo gallery") ||
    cmd.includes("गैलरी खोलो") ||
    cmd.includes("फोटो दिखाओ") ||
    cmd.includes("तस्वीरें दिखाओ")
  ) {
    return {
      handled: true,
      category: "camera",
      action: `फ़ोटो गैलरी खोल दी है। देखिये आपकी शानदार तस्वीरें!`,
      openModal: "gallery",
    };
  }

  // 7. FILES & STORAGE
  if (
    cmd.includes("open files") ||
    cmd.includes("file manager") ||
    cmd.includes("my storage") ||
    cmd.includes("documents dikhao") ||
    cmd.includes("downloads") ||
    cmd.includes("फाइल मैनेजर") ||
    cmd.includes("फ़ाइल खोलो") ||
    cmd.includes("डॉक्यूमेंट दिखाओ")
  ) {
    return {
      handled: true,
      category: "files",
      action: `फ़ाइल मैनेजर ओपन हो गया है। स्टोरेज और सभी दस्तावेज़ क्रमबद्ध हैं!`,
      openModal: "files",
    };
  }

  // 8. MEDIA CONTROLS
  if (
    cmd.includes("play music") ||
    cmd.includes("gaana bajao") ||
    cmd.includes("resume music") ||
    cmd.includes("गाना बजाओ") ||
    cmd.includes("म्यूजिक चलाओ") ||
    cmd.includes("गीत सुनाओ")
  ) {
    return {
      handled: true,
      category: "media",
      action: `म्यूजिक प्ले कर रही हूँ। वाइब चेक ऑन! 🎵`,
      mediaAction: "play",
    };
  }
  if (
    cmd.includes("pause music") ||
    cmd.includes("stop music") ||
    cmd.includes("gaana roko") ||
    cmd.includes("गाना रोको") ||
    cmd.includes("गाना बंद करो") ||
    cmd.includes("म्यूजिक रोको")
  ) {
    return {
      handled: true,
      category: "media",
      action: `म्यूजिक रोक दिया है।`,
      mediaAction: "pause",
    };
  }
  if (
    cmd.includes("next song") ||
    cmd.includes("agla gaana") ||
    cmd.includes("skip song") ||
    cmd.includes("अगला गाना") ||
    cmd.includes("गाना बदलो")
  ) {
    return {
      handled: true,
      category: "media",
      action: `अगला गाना बज रहा है!`,
      mediaAction: "next",
    };
  }
  if (
    cmd.includes("previous song") ||
    cmd.includes("pichla gaana") ||
    cmd.includes("पिछला गाना")
  ) {
    return {
      handled: true,
      category: "media",
      action: `पिछले गाने पर वापस स्विच किया।`,
      mediaAction: "prev",
    };
  }

  // 9. BROWSER & INTERNET SEARCH
  const ytMatch = cmd.match(/^(?:play\s+(.+?)\s+on\s+youtube|यूट्यूब\s+पर\s+(.+?)\s+चलाओ)$/);
  if (ytMatch) {
    const rawQ = ytMatch[1] || ytMatch[2];
    const query = encodeURIComponent(rawQ.trim());
    return {
      handled: true,
      category: "browser",
      action: `यूट्यूब पर ${rawQ} चला रही हूँ। मजे लीजिये!`,
      url: `https://www.youtube.com/results?search_query=${query}`,
      isBrowserAction: true,
      openModal: "browser",
      browserTarget: { url: `https://www.youtube.com/results?search_query=${query}`, query: rawQ },
    };
  }

  const searchMatch = cmd.match(/(?:search|google|search on web|dhoondo|सर्च करो|गूगल करो|ढूंढो)\s+(?:for\s+)?(.+)/);
  if (searchMatch && !cmd.includes("spotify") && !cmd.includes("youtube")) {
    const q = searchMatch[1].trim();
    return {
      handled: true,
      category: "browser",
      action: `वेब पर खोज रही हूँ: "${q}"। परिणाम तैयार हैं!`,
      url: `https://www.google.com/search?q=${encodeURIComponent(q)}`,
      isBrowserAction: true,
      openModal: "browser",
      browserTarget: { url: `https://www.google.com/search?q=${encodeURIComponent(q)}`, query: q },
    };
  }

  const openUrlMatch = cmd.match(/^open\s+((?:https?:\/\/)?[\w-]+(?:\.[\w-]+)+.*)$/);
  if (openUrlMatch) {
    let site = openUrlMatch[1].trim();
    if (!site.startsWith("http")) {
      site = "https://" + site;
    }
    return {
      handled: true,
      category: "browser",
      action: `${openUrlMatch[1]} खोल रही हूँ!`,
      url: site,
      isBrowserAction: true,
      openModal: "browser",
      browserTarget: { url: site },
    };
  }

  // 10. APPS LAUNCHER
  if (
    cmd.includes("open apps") ||
    cmd.includes("all apps") ||
    cmd.includes("show apps") ||
    cmd.includes("app drawer") ||
    cmd.includes("ऐप्स खोलो") ||
    cmd.includes("सारी ऐप्स दिखाओ")
  ) {
    return {
      handled: true,
      category: "apps",
      action: `ऐप ड्रॉअर खोल दिया है। आपकी सभी ऐप्स यहाँ हैं।`,
      openModal: "apps",
    };
  }
  if (
    cmd.includes("recent apps") ||
    cmd.includes("app switcher") ||
    cmd.includes("multitasking") ||
    cmd.includes("रीसेंट ऐप्स")
  ) {
    return {
      handled: true,
      category: "apps",
      action: `रीसेंट ऐप्स ओवरव्यू खोल रही हूँ।`,
      openModal: "recents",
    };
  }

  // App specific direct opens
  const specificAppMatch = cmd.match(/^(?:open\s+([a-zA-Z\s]+)|([a-zA-Z\u0900-\u097F\s]+)\s+खोलो)$/);
  if (specificAppMatch) {
    const appQuery = (specificAppMatch[1] || specificAppMatch[2] || "").trim().toLowerCase();
    if (appQuery === "camera" || appQuery === "कैमरा") {
      return { handled: true, category: "camera", action: "कैमरा खोल दिया है!", openModal: "camera" };
    }
    if (appQuery === "gallery" || appQuery === "photos" || appQuery === "गैलरी" || appQuery === "फोटो") {
      return { handled: true, category: "camera", action: "गैलरी खोल दी है!", openModal: "gallery" };
    }
    if (appQuery === "dialer" || appQuery === "contacts" || appQuery === "phone" || appQuery === "फोन" || appQuery === "डायलर") {
      return { handled: true, category: "calls", action: "फ़ोन डायलर खोल दिया है।", openModal: "dialer" };
    }
    if (appQuery === "sms" || appQuery === "messages" || appQuery === "मैसेज" || appQuery === "एसएमएस") {
      return { handled: true, category: "sms", action: "मैसेजेस ऐप खोल दिया है!", openModal: "sms" };
    }
    if (appQuery === "settings" || appQuery === "सेटिंग्स" || appQuery === "सेटिंग") {
      return { handled: true, category: "system", action: "सेटिंग्स खोल दी हैं।", openModal: "system" };
    }
    if (appQuery === "files" || appQuery === "file manager" || appQuery === "फाइल" || appQuery === "फ़ाइल") {
      return { handled: true, category: "files", action: "फ़ाइलें खोल दी हैं।", openModal: "files" };
    }
    if (appQuery === "browser" || appQuery === "chrome" || appQuery === "ब्राउज़र") {
      return { handled: true, category: "browser", action: "ब्राउज़र खोल दिया है।", openModal: "browser" };
    }
    if (appQuery === "notifications" || appQuery === "नोटिफिकेशन") {
      return { handled: true, category: "notifications", action: "नोटिफिकेशन्स खोल दी हैं।", openModal: "notifications" };
    }
  }

  // 11. ANDROID ARCHITECTURE & ACCESSIBILITY INSPECTOR
  if (
    cmd.includes("android architecture") ||
    cmd.includes("accessibility service") ||
    cmd.includes("native bridge") ||
    cmd.includes("show android code")
  ) {
    return {
      handled: true,
      category: "architecture",
      action: `Android Native Automation Architecture Blueprint open kar rahi hoon. Dekho kaise AccessibilityService aur Intent Engine integrate hota hai.`,
      openModal: "architecture",
    };
  }

  // 12. ACCESSIBILITY & AUTOMATION GESTURES (Tap, Scroll, Swipe, Back, Home)
  if (cmd.includes("go back") || cmd.includes("piche jao") || cmd.includes("back button") || cmd.includes("पीछे जाओ") || cmd.includes("वापस जाओ")) {
    return {
      handled: true,
      category: "automation",
      action: `बैक बटन दबा दिया।`,
      automationStep: { type: "back" },
    };
  }
  if (cmd.includes("go home") || cmd.includes("home screen") || cmd.includes("home button") || cmd.includes("होम स्क्रीन") || cmd.includes("होम पर जाओ")) {
    return {
      handled: true,
      category: "automation",
      action: `होम स्क्रीन पर नेविगेट कर दिया।`,
      automationStep: { type: "home" },
    };
  }
  if (cmd.includes("scroll down") || cmd.includes("niche scroll karo") || cmd.includes("नीचे स्क्रॉल करो") || cmd.includes("नीचे करो")) {
    return {
      handled: true,
      category: "automation",
      action: `स्क्रीन नीचे स्क्रॉल कर दी।`,
      automationStep: { type: "scroll", value: "down" },
    };
  }
  if (cmd.includes("scroll up") || cmd.includes("upar scroll karo") || cmd.includes("ऊपर स्क्रॉल करो") || cmd.includes("ऊपर करो")) {
    return {
      handled: true,
      category: "automation",
      action: `स्क्रीन ऊपर स्क्रॉल कर दी।`,
      automationStep: { type: "scroll", value: "up" },
    };
  }

  // 13. ULTRA-FAST INSTANT CONVERSATIONAL RESPONSES (0ms Latency)
  // Greetings
  if (/^(hi|hello|hey|namaste|pranam|salam|hola|sup|yo|नमस्ते|प्रणाम|हाय|हेलो|हे)$/i.test(cmd)) {
    return {
      handled: true,
      category: "chat",
      action: `नमस्ते ${displayName}! बताइए आज क्या हुक्म है? मैं बिल्कुल तैयार हूँ!`,
    };
  }

  // How are you / Status
  if (
    cmd.includes("kaise ho") ||
    cmd.includes("kya haal") ||
    cmd.includes("how are you") ||
    cmd.includes("kya chal raha hai") ||
    cmd.includes("कैसी हो") ||
    cmd.includes("कैसे हो") ||
    cmd.includes("क्या हाल है") ||
    cmd.includes("क्या चल रहा है")
  ) {
    return {
      handled: true,
      category: "chat",
      action: `एकदम फ़र्स्ट-क्लास और मस्त! आपके हर काम को चुटकी में करने के लिए तैयार। आप बताइए, क्या चल रहा है?`,
    };
  }

  // Who are you / Identity / Name
  if (
    cmd.includes("who are you") ||
    cmd.includes("tum kaun ho") ||
    cmd.includes("apna intro") ||
    cmd.includes("what is your name") ||
    cmd.includes("tera naam kya hai") ||
    cmd.includes("about you") ||
    cmd.includes("तुम कौन हो") ||
    cmd.includes("तुम्हारा नाम क्या है") ||
    cmd.includes("अपना परिचय दो") ||
    cmd.includes("तेरा नाम")
  ) {
    return {
      handled: true,
      category: "chat",
      action: `मैं हूँ Aria—आपकी सुपर-स्मार्ट, हाज़िरजवाब और सैसी AI असिस्टेंट! कॉल्स, ऐप्स, सेटिंग्स से लेकर हर सवाल का जवाब मेरे पास है।`,
    };
  }

  // Web vs Android assistant queries
  if (cmd.includes("web based") || cmd.includes("android assistant") || cmd.includes("android base") || cmd.includes("android ho ya web") || cmd.includes("kaisa assistant ho")) {
    return {
      handled: true,
      category: "chat",
      action: `मैं पूरी तरह से Android-इंटीग्रेटेड पावरहाउस हूँ! कॉल्स, मैसेजिंग, कैमरा और डीप सिस्टम सेटिंग्स सब मेरी मुट्ठी में हैं।`,
    };
  }

  // Creator / Developer
  if (cmd.includes("who made you") || cmd.includes("tumhe kisne banaya") || cmd.includes("developer kaun hai") || cmd.includes("who is your creator") || cmd.includes("किसने बनाया") || cmd.includes("डेवलपर कौन है")) {
    return {
      handled: true,
      category: "chat",
      action: `मुझे डेवलपर सत्यम साहनी (Satyam Sahani) ने बड़े प्यार, तेज़ दिमाग और ढेर सारे स्वैग के साथ बनाया है!`,
    };
  }

  // Time & Date
  if (cmd.includes("time kya hai") || cmd.includes("what is the time") || cmd.includes("kitne baje hain") || cmd.includes("current time") || cmd.includes("समय क्या है") || cmd.includes("कितने बजे हैं") || cmd.includes("टाइम क्या है")) {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return {
      handled: true,
      category: "chat",
      action: `अभी ठीक ${now} बजे हैं। कहीं जाने में देर तो नहीं हो रही?`,
    };
  }
  if (cmd.includes("date kya hai") || cmd.includes("aaj ki date") || cmd.includes("what is today's date") || cmd.includes("today date") || cmd.includes("आज की तारीख") || cmd.includes("तारीख क्या है") || cmd.includes("आज कौन सा दिन है")) {
    const today = new Date().toLocaleDateString("hi-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    return {
      handled: true,
      category: "chat",
      action: `आज ${today} है। दिन को ख़ास बनाइये!`,
    };
  }

  // Weather
  if (cmd.includes("weather") || cmd.includes("mausam") || cmd.includes("मौसम कैसा है") || cmd.includes("आज का मौसम")) {
    return {
      handled: true,
      category: "chat",
      action: `आज मौसम एकदम सुहावना और साफ़ है! तापमान लगभग 26°C है।`,
    };
  }

  // Thank you
  if (cmd.includes("thank you") || cmd.includes("thanks") || cmd.includes("dhanyawad") || cmd.includes("shukriya") || cmd.includes("धन्यवाद") || cmd.includes("शुक्रिया")) {
    return {
      handled: true,
      category: "chat",
      action: `अरे कोई बात नहीं! जब भी मदद या मस्ती चाहिए हो, Aria हमेशा आपके साथ है।`,
    };
  }

  // Good morning / Good night
  if (cmd.includes("good morning") || cmd.includes("shubh prabhat") || cmd.includes("सुप्रभात") || cmd.includes("शुभ प्रभात") || cmd.includes("गुड मॉर्निंग")) {
    return {
      handled: true,
      category: "chat",
      action: `शुभ प्रभात, ${displayName}! उठिए, चमकिये और आज कुछ धमाकेदार कीजिये! ☕`,
    };
  }
  if (cmd.includes("good night") || cmd.includes("shubh ratri") || cmd.includes("so jao") || cmd.includes("शुभ रात्रि") || cmd.includes("गुड नाईट") || cmd.includes("सो जाओ")) {
    return {
      handled: true,
      category: "chat",
      action: `शुभ रात्रि ${displayName}! मीठे सपने देखियेगा और फ़ोन को चार्जिंग पर लगाना मत भूलना। 🌙`,
    };
  }

  // Capabilities / Help
  if (cmd.includes("kya kar sakti ho") || cmd.includes("what can you do") || cmd.includes("help") || cmd.includes("features") || cmd.includes("क्या कर सकती हो") || cmd.includes("मदद करो") || cmd.includes("फीचर्स")) {
    return {
      handled: true,
      category: "chat",
      action: `कॉल्स, मैसेज, कैमरा, फ़ाइलें, सिस्टम सेटिंग्स और ढेर सारी मज़ेदार बातें—सब कुछ कर सकती हूँ! बताइए क्या करूँ?`,
    };
  }

  // If nothing matched, let Gemini LLM handle general chit-chat
  return {
    handled: false,
    category: "chat",
    action: "",
  };
}
