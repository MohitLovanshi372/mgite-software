/**
 * Language Model & Dictionary Mapping Utility for Hinglish & Hindi Command Parsing
 *
 * Provides dictionary-driven normalization, intent translation, entity extraction,
 * and canonical English command mapping for Indian code-switching voice interactions
 * (e.g., "Jarvis, light chalao", "Jarvis, system status dikhao", "जार्विस, लाइट चलाओ").
 */

export interface HinglishParsedCommand {
  rawInput: string;
  cleanedInput: string;
  wakeWordDetected: boolean;
  wakeWord?: string;
  normalizedText: string;
  canonicalEnglish: string;
  action: 'turn_on' | 'turn_off' | 'status' | 'open' | 'play' | 'pause' | 'create' | 'remember' | 'remind' | 'unknown';
  target: 'light' | 'system_status' | 'music' | 'camera' | 'wifi' | 'app' | 'general';
  intent: string;
  confidence: number;
  isHinglishOrHindi: boolean;
  detectedLanguage: 'hi-IN' | 'en-IN' | 'en-US' | 'hinglish';
  tokens: string[];
  query?: string;
}

/**
 * Dictionary mapping for Hinglish and Hindi action verbs to canonical actions
 */
export const HINGLISH_VERB_DICTIONARY: Record<
  string,
  {
    action: 'turn_on' | 'turn_off' | 'status' | 'open' | 'play' | 'pause' | 'create' | 'remember' | 'remind';
    canonical: string;
    englishVerb: string;
  }
> = {
  // Activation / Turn On
  chalao: { action: 'turn_on', canonical: 'turn on', englishVerb: 'turn on' },
  chala: { action: 'turn_on', canonical: 'turn on', englishVerb: 'turn on' },
  chalu: { action: 'turn_on', canonical: 'turn on', englishVerb: 'turn on' },
  chalo: { action: 'turn_on', canonical: 'turn on', englishVerb: 'turn on' },
  jalao: { action: 'turn_on', canonical: 'turn on', englishVerb: 'turn on' },
  jala: { action: 'turn_on', canonical: 'turn on', englishVerb: 'turn on' },
  jalado: { action: 'turn_on', canonical: 'turn on', englishVerb: 'turn on' },
  'on karo': { action: 'turn_on', canonical: 'turn on', englishVerb: 'turn on' },
  'on kar': { action: 'turn_on', canonical: 'turn on', englishVerb: 'turn on' },
  'on kardo': { action: 'turn_on', canonical: 'turn on', englishVerb: 'turn on' },
  'on kar do': { action: 'turn_on', canonical: 'turn on', englishVerb: 'turn on' },
  'start karo': { action: 'turn_on', canonical: 'start', englishVerb: 'start' },
  'enable karo': { action: 'turn_on', canonical: 'enable', englishVerb: 'enable' },
  'shuru karo': { action: 'turn_on', canonical: 'start', englishVerb: 'start' },
  'चलाओ': { action: 'turn_on', canonical: 'turn on', englishVerb: 'turn on' },
  'जलाओ': { action: 'turn_on', canonical: 'turn on', englishVerb: 'turn on' },
  'ऑन करो': { action: 'turn_on', canonical: 'turn on', englishVerb: 'turn on' },
  'शुरू करो': { action: 'turn_on', canonical: 'start', englishVerb: 'start' },

  // Deactivation / Turn Off
  'band karo': { action: 'turn_off', canonical: 'turn off', englishVerb: 'turn off' },
  'band kar': { action: 'turn_off', canonical: 'turn off', englishVerb: 'turn off' },
  'band kardo': { action: 'turn_off', canonical: 'turn off', englishVerb: 'turn off' },
  'band kar do': { action: 'turn_off', canonical: 'turn off', englishVerb: 'turn off' },
  bujhao: { action: 'turn_off', canonical: 'turn off', englishVerb: 'turn off' },
  bujha: { action: 'turn_off', canonical: 'turn off', englishVerb: 'turn off' },
  bujhado: { action: 'turn_off', canonical: 'turn off', englishVerb: 'turn off' },
  'off karo': { action: 'turn_off', canonical: 'turn off', englishVerb: 'turn off' },
  'off kar': { action: 'turn_off', canonical: 'turn off', englishVerb: 'turn off' },
  'off kardo': { action: 'turn_off', canonical: 'turn off', englishVerb: 'turn off' },
  'off kar do': { action: 'turn_off', canonical: 'turn off', englishVerb: 'turn off' },
  'disable karo': { action: 'turn_off', canonical: 'disable', englishVerb: 'disable' },
  'roko': { action: 'turn_off', canonical: 'stop', englishVerb: 'stop' },
  'rok do': { action: 'turn_off', canonical: 'stop', englishVerb: 'stop' },
  'बंद करो': { action: 'turn_off', canonical: 'turn off', englishVerb: 'turn off' },
  'बुझाओ': { action: 'turn_off', canonical: 'turn off', englishVerb: 'turn off' },
  'ऑफ करो': { action: 'turn_off', canonical: 'turn off', englishVerb: 'turn off' },

  // Status / Inspection
  dikhao: { action: 'status', canonical: 'show', englishVerb: 'show' },
  batao: { action: 'status', canonical: 'show', englishVerb: 'tell' },
  bataiye: { action: 'status', canonical: 'show', englishVerb: 'show' },
  dekho: { action: 'status', canonical: 'check', englishVerb: 'check' },
  dekhau: { action: 'status', canonical: 'show', englishVerb: 'show' },
  'check karo': { action: 'status', canonical: 'check', englishVerb: 'check' },
  'kya hai': { action: 'status', canonical: 'check', englishVerb: 'what is' },
  'दिखाओ': { action: 'status', canonical: 'show', englishVerb: 'show' },
  'बताओ': { action: 'status', canonical: 'show', englishVerb: 'show' },
  'चेक करो': { action: 'status', canonical: 'check', englishVerb: 'check' },

  // Launch / Open
  kholo: { action: 'open', canonical: 'open', englishVerb: 'open' },
  khol: { action: 'open', canonical: 'open', englishVerb: 'open' },
  'open karo': { action: 'open', canonical: 'open', englishVerb: 'open' },
  'खोलो': { action: 'open', canonical: 'open', englishVerb: 'open' },
  'ओपन करो': { action: 'open', canonical: 'open', englishVerb: 'open' },

  // Memory & Reminders
  'yaad rakhna': { action: 'remember', canonical: 'remember', englishVerb: 'remember' },
  'yaad rakho': { action: 'remember', canonical: 'remember', englishVerb: 'remember' },
  'yaad dila dena': { action: 'remind', canonical: 'remind', englishVerb: 'remind' },
  'yaad dilana': { action: 'remind', canonical: 'remind', englishVerb: 'remind' },
  'याद रखना': { action: 'remember', canonical: 'remember', englishVerb: 'remember' },
  'याद दिलाना': { action: 'remind', canonical: 'remind', englishVerb: 'remind' },
};

/**
 * Dictionary mapping for Hinglish and Hindi device nouns
 */
export const HINGLISH_DEVICE_DICTIONARY: Record<
  string,
  {
    target: 'light' | 'system_status' | 'music' | 'camera' | 'wifi' | 'app' | 'general';
    canonical: string;
  }
> = {
  // Illumination & Lights
  light: { target: 'light', canonical: 'light' },
  lights: { target: 'light', canonical: 'lights' },
  batti: { target: 'light', canonical: 'light' },
  battie: { target: 'light', canonical: 'light' },
  roshni: { target: 'light', canonical: 'light' },
  chiraag: { target: 'light', canonical: 'light' },
  'लाइट': { target: 'light', canonical: 'light' },
  'बत्ती': { target: 'light', canonical: 'light' },
  'रोशनी': { target: 'light', canonical: 'light' },

  // Telemetry & Systems
  system: { target: 'system_status', canonical: 'system status' },
  'system status': { target: 'system_status', canonical: 'system status' },
  status: { target: 'system_status', canonical: 'system status' },
  telemetry: { target: 'system_status', canonical: 'system status' },
  vitals: { target: 'system_status', canonical: 'system status' },
  health: { target: 'system_status', canonical: 'system status' },
  battery: { target: 'system_status', canonical: 'system status' },
  'cpu usage': { target: 'system_status', canonical: 'system status' },
  'ram usage': { target: 'system_status', canonical: 'system status' },
  'सिस्टम': { target: 'system_status', canonical: 'system status' },
  'सिस्टम स्टेटस': { target: 'system_status', canonical: 'system status' },
  'स्टेटस': { target: 'system_status', canonical: 'system status' },

  // Audio / Media
  music: { target: 'music', canonical: 'music' },
  gana: { target: 'music', canonical: 'music' },
  gaana: { target: 'music', canonical: 'music' },
  song: { target: 'music', canonical: 'music' },
  songs: { target: 'music', canonical: 'music' },
  audio: { target: 'music', canonical: 'music' },
  'गाना': { target: 'music', canonical: 'music' },
  'संगीत': { target: 'music', canonical: 'music' },

  // Peripherals
  camera: { target: 'camera', canonical: 'camera' },
  webcam: { target: 'camera', canonical: 'camera' },
  'कैमरा': { target: 'camera', canonical: 'camera' },

  // Network
  wifi: { target: 'wifi', canonical: 'wifi' },
  internet: { target: 'wifi', canonical: 'internet' },
  network: { target: 'wifi', canonical: 'network' },
  'वाईफाई': { target: 'wifi', canonical: 'wifi' },
};

/**
 * Phonetic Acoustic Misrecognitions Dictionary
 * Maps common speech-to-text transcript anomalies from English-tuned ASR engines
 * to proper Hinglish/Hindi words.
 */
export const PHONETIC_ACOUSTIC_RULES: Array<{
  pattern: RegExp;
  replacement: string;
}> = [
  // "light shallow" / "light shallot" / "light chalo" -> "light chalao"
  {
    pattern: /\blight\s+(shallow|shallot|chalo|chalau|salot|calo|cahlo|chala)\b/gi,
    replacement: 'light chalao',
  },
  // "light jalo" / "light jalaw" -> "light jalao"
  {
    pattern: /\blight\s+(jalo|jalaw|jallao)\b/gi,
    replacement: 'light jalao',
  },
  // "light burn karo" / "light pan karo" / "light bund karo" -> "light band karo"
  {
    pattern: /\blight\s+(burn\s+karo|pan\s+karo|bund\s+karo|ban\s+karo|bunk\s+karo|ban\s+kar)\b/gi,
    replacement: 'light band karo',
  },
  // "system status the cow" / "status the cow" -> "status dikhao"
  {
    pattern: /\b(system\s+status|status)\s+(the\s+cow|decal|the\s+khao|the\s+call|dekho|dekhau|dekao|dee\s*cow)\b/gi,
    replacement: '$1 dikhao',
  },
  // Standalone "the cow" at the end of a query
  {
    pattern: /\bthe\s+cow\b/gi,
    replacement: 'dikhao',
  },
  // "light on kara" / "light on kar do"
  {
    pattern: /\blight\s+(on\s+kara|on\s+kar\s+do|on\s+kardo)\b/gi,
    replacement: 'light on karo',
  },
  // "light off kara" / "light off kar do"
  {
    pattern: /\blight\s+(off\s+kara|off\s+kar\s+do|off\s+kardo)\b/gi,
    replacement: 'light off karo',
  },
  // "batti" mishearings
  {
    pattern: /\b(batt?ie|batti\s+ko)\b/gi,
    replacement: 'batti',
  },
];

/**
 * Normalizes speech transcript using phonetic corrections, multi-alternative hypotheses,
 * and canonical wake-word formatting.
 */
export function normalizeHinglishTranscript(
  rawTranscript: string,
  alternatives: string[] = []
): string {
  if (!rawTranscript) return '';
  let text = rawTranscript.trim();

  // 1. Inspect alternatives if primary lacks clear command pattern
  const candidates = [text, ...alternatives];
  for (const cand of candidates) {
    if (
      /(light\s+chalao|light\s+jalao|status\s+dikhao|system\s+status|light\s+band|लाइट\s*चलाओ|स्टेटस\s*दिखाओ)/i.test(
        cand
      )
    ) {
      text = cand;
      break;
    }
  }

  // 2. Normalize wake words ("jarvis", "hey jarvis", "ultron", "जार्विस")
  text = text.replace(/^(hey\s+)?(jarvis|ultron|जार्विस)[\s,:;—-]+/i, 'Jarvis, ');

  // 3. Apply phonetic acoustic misrecognition rules
  for (const rule of PHONETIC_ACOUSTIC_RULES) {
    text = text.replace(rule.pattern, rule.replacement);
  }

  return text.trim();
}

/**
 * Detects whether a string contains Hinglish or Hindi words / Devanagari script.
 */
export function isHinglishOrHindi(text: string): boolean {
  if (!text) return false;

  // Check for Devanagari unicode range (0900-097F)
  if (/[\u0900-\u097F]/.test(text)) return true;

  // Check against vocabulary entries in Hinglish dictionary
  const lower = text.toLowerCase();
  const knownKeywords = [
    'chalao',
    'chala',
    'jalao',
    'band karo',
    'bujhao',
    'dikhao',
    'batao',
    'bataiye',
    'kholo',
    'batti',
    'roshni',
    'karo',
    'kardo',
    'dena',
    'yaad',
    'rakhna',
    'dilana',
    'kaise',
    'kya',
    'hai',
    'hain',
    'bhai',
    'namaste',
    'shuru',
  ];

  return knownKeywords.some((kw) => lower.includes(kw));
}

/**
 * Parses a raw command string using the Hinglish dictionary model.
 * Produces structured classification, canonical English command, actions, and targets.
 */
export function parseHinglishCommand(
  rawTranscript: string,
  alternatives: string[] = []
): HinglishParsedCommand {
  const normalized = normalizeHinglishTranscript(rawTranscript, alternatives);

  // Wake word extraction
  const wakeWordMatch = normalized.match(/^(Jarvis|Ultron|जार्विस)[,\s]*/i);
  const wakeWordDetected = Boolean(wakeWordMatch);
  const wakeWord = wakeWordMatch ? wakeWordMatch[1] : undefined;

  // Stripped command body
  const cleanedInput = normalized.replace(/^(Jarvis|Ultron|जार्विस)[,\s]*/i, '').trim();
  const lower = cleanedInput.toLowerCase();
  const isHindiOrHinglish = isHinglishOrHindi(normalized);

  // Determine detected language script
  let detectedLanguage: 'hi-IN' | 'en-IN' | 'en-US' | 'hinglish' = 'en-US';
  if (/[\u0900-\u097F]/.test(normalized)) {
    detectedLanguage = 'hi-IN';
  } else if (isHindiOrHinglish) {
    detectedLanguage = 'en-IN'; // Indian English model is tuned for bilingual Latin code-switching
  }

  // 1. Identify Target Device
  let target: 'light' | 'system_status' | 'music' | 'camera' | 'wifi' | 'app' | 'general' = 'general';
  for (const [key, val] of Object.entries(HINGLISH_DEVICE_DICTIONARY)) {
    if (lower.includes(key.toLowerCase())) {
      target = val.target;
      break;
    }
  }

  // 2. Identify Action Verb
  let action: HinglishParsedCommand['action'] = 'unknown';
  let englishVerb = 'execute';

  for (const [key, val] of Object.entries(HINGLISH_VERB_DICTIONARY)) {
    if (lower.includes(key.toLowerCase())) {
      action = val.action;
      englishVerb = val.englishVerb;
      break;
    }
  }

  // Fallback heuristics if action or target still ambiguous
  if (target === 'light' && action === 'unknown') {
    if (/(on|enable|chala|jala)/i.test(lower)) {
      action = 'turn_on';
      englishVerb = 'turn on';
    } else if (/(off|disable|band|bujha)/i.test(lower)) {
      action = 'turn_off';
      englishVerb = 'turn off';
    }
  }

  if (target === 'system_status' && action === 'unknown') {
    action = 'status';
    englishVerb = 'show';
  }

  // Determine High-Level Intent & YouTube/Music Mapping
  let intent = 'CONVERSATION';
  let confidence = 0.85;
  let query: string | undefined;

  const isYtOpen =
    (lower.includes('youtube') || lower.includes('यूट्यूब')) &&
    (action === 'open' || /(kholo|open|launch)/i.test(lower)) &&
    !/(search|play|dhundho|dhundo|songs?|gana|gaana|music|track|ke\s+songs?|video)/i.test(lower);

  const isMusicStop =
    (target === 'music' || /(music|gana|gaana|song|म्यूजिक|गाना)/i.test(lower)) &&
    (action === 'turn_off' || action === 'pause' || /(band|roko|pause|stop)/i.test(lower));

  const isMusicPlayOrSearch =
    (/(youtube|music|song|songs|gana|gaana|track|audio|believer|arijit|spotify|संगीत|गाना)/i.test(lower) &&
      /(play|search|chalao|chala|bajao|baja|shuru|kholo|dhundho)/i.test(lower)) ||
    /(ke\s+songs?\s+(chalao|bajao|play))/i.test(lower) ||
    /^play\s+[a-z0-9]/i.test(lower) ||
    /^(music|gana|gaana)\s+(chalao|bajao|shuru)/i.test(lower);

  if (isMusicStop) {
    intent = 'stop_music';
    action = 'turn_off';
    target = 'music';
    confidence = 0.98;
  } else if (isYtOpen) {
    intent = 'open_youtube';
    action = 'open';
    target = 'app';
    confidence = 0.98;
  } else if (isMusicPlayOrSearch) {
    const isGenericMusic =
      /^(play\s+music|music\s+chalao|gana\s+chalao|gaana\s+chalao|play\s+songs?|songs?\s+chalao|music\s+play\s+karo|music\s+shuru\s+karo|गाना\s*चलाओ|संगीत\s*चलाओ)$/i.test(
        cleanedInput.trim()
      );

    if (isGenericMusic) {
      intent = 'play_music';
      action = 'play';
      target = 'music';
      confidence = 0.96;
    } else {
      let q = cleanedInput;
      q = q.replace(/\b(search\s+on\s+youtube|search\s+youtube\s+for|on\s+youtube|in\s+youtube|youtube\s+par|youtube\s+pe)\b/gi, '').trim();
      q = q.replace(/^(play|search)\s+/i, '');
      q = q.replace(/\s+(chalao|chala\s+do|chala\s+dena|bajao|baja\s+do|shuru\s+karo|play\s+karo|laga\s+do|lagao)\b/gi, '');
      q = q.replace(/\bke\s+(songs?|gaane|gana)\b/gi, 'songs');
      q = q.replace(/[?!.,;:"]+/g, '').trim();

      intent = 'search_youtube';
      query = q;
      action = 'play';
      target = 'music';
      confidence = 0.96;
    }
  } else if (target === 'system_status' || action === 'status') {
    intent = 'SYSTEM_STATUS_REQUEST';
    confidence = 0.95;
  } else if (target === 'light' || target === 'camera' || target === 'wifi' || action === 'turn_on' || action === 'turn_off') {
    intent = 'COMPUTER_ACTION_REQUEST';
    confidence = 0.94;
  } else if (action === 'remember') {
    intent = 'MEMORY_REQUEST';
    confidence = 0.92;
  } else if (action === 'remind') {
    intent = 'REMINDER_REQUEST';
    confidence = 0.92;
  }

  // Formulate Canonical English Translation
  let canonicalEnglish = cleanedInput;
  if (intent === 'open_youtube') {
    canonicalEnglish = 'open YouTube';
  } else if (intent === 'stop_music') {
    canonicalEnglish = 'stop music';
  } else if (intent === 'search_youtube' && query) {
    canonicalEnglish = `search ${query} on YouTube`;
  } else if (target === 'light') {
    canonicalEnglish = action === 'turn_off' ? 'turn off lights' : 'turn on lights';
  } else if (target === 'system_status') {
    canonicalEnglish = 'show system status';
  } else if (target === 'music') {
    canonicalEnglish = action === 'turn_off' || action === 'pause' ? 'pause music' : 'play music';
  } else if (action !== 'unknown') {
    canonicalEnglish = `${englishVerb} ${target}`;
  }

  const tokens = cleanedInput
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  return {
    rawInput: rawTranscript,
    cleanedInput,
    wakeWordDetected,
    wakeWord,
    normalizedText: normalized,
    canonicalEnglish,
    action,
    target,
    intent,
    confidence,
    isHinglishOrHindi: isHindiOrHinglish,
    detectedLanguage,
    tokens,
    query,
  };
}
