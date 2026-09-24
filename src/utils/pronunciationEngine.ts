/**
 * Pronunciation & Phonetic Preprocessing Engine for Hindi, Hinglish, and English
 *
 * Provides accurate phonetic normalization for Web Speech API and backend TTS:
 * 1. Language Detection (Pure Hindi Devanagari, Hinglish Romanized Hindi, English)
 * 2. Phonetic Acronym Expansion (AI -> Aye Eye, GLB -> G L B, 3D -> Three D, etc.)
 * 3. Hindi Devanagari Pronunciation Enhancement (Cadence pauses for danda '।', halant smoothing)
 * 4. Hinglish Pronunciation Optimization (Vowel duration and syllable stress for Indian English & Hindi voices)
 * 5. Code-switching preservation (Mixed Hindi + English phrases)
 */

import { SpeechTextNormalizer } from './speechTextNormalizer.ts';

export type LanguageMode = 'AUTO' | 'HINDI' | 'HINGLISH' | 'ENGLISH';
export type DetectedVoiceLanguage = 'hi' | 'en-IN' | 'en';

export interface PronunciationResult {
  originalText: string;
  processedText: string;
  detectedLanguage: DetectedVoiceLanguage;
  recommendedLocale: 'hi-IN' | 'en-IN' | 'en-US';
  recommendedPitch: number;
  recommendedRate: number;
  isHindi: boolean;
  isHinglish: boolean;
  isEnglish: boolean;
}

const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
const DEVANAGARI_GLOBAL_REGEX = /[\u0900-\u097F]/g;

// Key vocabulary for Romanized Hindi / Hinglish detection
const HINGLISH_KEYWORDS = new Set([
  'aap', 'aapka', 'aapki', 'aapke', 'aapko', 'aaj', 'achha', 'accha', 'aur',
  'batao', 'bataiye', 'bhi', 'bohot', 'bahut', 'chahiye', 'chalu', 'chal',
  'dhanyawad', 'dhanyavaad', 'ek', 'gaya', 'gayi', 'gaye', 'haan', 'hai', 'hain',
  'ho', 'hoga', 'hogi', 'hum', 'jaana', 'jana', 'karna', 'karein', 'karo', 'kaise',
  'kya', 'kyun', 'kab', 'kripya', 'kripaya', 'lagta', 'lekin', 'mera', 'meri',
  'mere', 'mujhe', 'mujhko', 'madad', 'nahi', 'nahin', 'namaste', 'pe', 'par',
  'roko', 'samay', 'shukriya', 'suno', 'theek', 'thoda', 'tum', 'tumhara',
  'wala', 'wali', 'wale', 'ye', 'yeh', 'woh', 'wo', 'zaroor', 'jarur', 'swagat',
  'sahayata', 'pranam', 'alvida', 'shuru', 'kijiye', 'dijiye', 'lijiye', 'bilkul',
  'dilaunga', 'dilaungi', 'dilana', 'karti', 'karta', 'dungi', 'dunga',
  'leti', 'leta', 'rahi', 'raha', 'sakti', 'sakta', 'samajh', 'badhiya'
]);

// Acronym & technical dictionary for English & Hinglish pronunciation (NEVER insert dots that force spelling)
const ACRONYM_MAP: Record<string, string> = {
  JARVIS: 'Jarvis',
  ULTRON: 'Ultron',
  '3D': 'Three-D',
  '2D': 'Two-D',
  RAM: 'Ram',
};

// Hindi Devanagari technical word phonetics (assists browser Hindi voices to speak English loanwords cleanly)
const DEVANAGARI_LOANWORD_MAP: Record<string, string> = {
  'एआई': 'ए आई',
  'ए.आई.': 'ए आई',
  'जीएलबी': 'जी एल बी',
  'यूआई': 'यू आई',
  'एफपीएस': 'एफ पी एस',
  'एचडी': 'एच डी',
  '३डी': 'थ्री डी',
  '3D': 'थ्री डी',
  '3d': 'थ्री डी',
  'AI': 'ए आई',
  'GLB': 'जी एल बी',
};

// Hinglish Romanized phonetic adjustments for Indian English & Hindi speech synthesizers
const HINGLISH_PHONETIC_REPLACEMENTS: [RegExp, string][] = [
  // Ensure soft dental and aspirated stops are pronounced clearly
  [/\bnamaste\b/gi, 'namaste'],
  [/\bshukriya\b/gi, 'shukriyaa'],
  [/\bdhanyawad\b/gi, 'dhanyawaad'],
  [/\bdhanyavaad\b/gi, 'dhanyawaad'],
  [/\bkripya\b/gi, 'kripayaa'],
  [/\bkripaya\b/gi, 'kripayaa'],
  [/\bswagat\b/gi, 'swaagat'],
  [/\bsahayata\b/gi, 'sahaayataa'],
  [/\bbataiye\b/gi, 'bataaiye'],
  [/\bbatao\b/gi, 'bataao'],
  [/\bachha\b/gi, 'acchaa'],
  [/\baccha\b/gi, 'acchaa'],
  [/\bzaroor\b/gi, 'zaroor'],
  [/\bbohot\b/gi, 'bahut'],
  [/\bkijiye\b/gi, 'keejiye'],
  [/\bdijiye\b/gi, 'deejiye'],
  [/\blijiye\b/gi, 'leejiye'],
];

export class PronunciationEngine {
  /**
   * Detects whether text is Hindi (Devanagari), Hinglish, or English
   */
  public static detectLanguage(
    text: string,
    forcedMode: LanguageMode = 'AUTO'
  ): DetectedVoiceLanguage {
    if (!text || typeof text !== 'string') return 'en';

    if (forcedMode === 'HINDI') return 'hi';
    if (forcedMode === 'HINGLISH') return 'en-IN';
    if (forcedMode === 'ENGLISH') return 'en';

    // 1. Check for Devanagari script characters
    if (DEVANAGARI_REGEX.test(text)) {
      return 'hi';
    }

    // 2. Check for Romanized Hinglish vocabulary
    const cleanWords = text
      .toLowerCase()
      .split(/[\s,.;:!?।\-()"\/\\]+/)
      .filter(Boolean);

    let hinglishCount = 0;
    for (const w of cleanWords) {
      if (HINGLISH_KEYWORDS.has(w)) {
        hinglishCount++;
      }
    }

    const ratio = cleanWords.length > 0 ? hinglishCount / cleanWords.length : 0;
    if (hinglishCount >= 2 || ratio >= 0.22) {
      return 'en-IN'; // Indian English / Hinglish voice route
    }

    return 'en';
  }

  /**
   * Pre-processes text to optimize pronunciation for the target speech synthesizer.
   */
  public static process(
    text: string,
    forcedMode: LanguageMode = 'AUTO'
  ): PronunciationResult {
    if (!text || !text.trim()) {
      return {
        originalText: text,
        processedText: '',
        detectedLanguage: 'en',
        recommendedLocale: 'en-US',
        recommendedPitch: 0.72,
        recommendedRate: 0.92,
        isHindi: false,
        isHinglish: false,
        isEnglish: true,
      };
    }

    // Step 1: Normalize through SpeechTextNormalizer
    const normalized = SpeechTextNormalizer.normalize(text, {
      targetLanguageMode: forcedMode,
    });
    const normalizedText = normalized.normalizedText || text;

    const detected = this.detectLanguage(normalizedText, forcedMode);
    let processed = normalizedText;

    if (detected === 'hi') {
      // --- HINDI (Devanagari) PRONUNCIATION ENHANCEMENT ---
      // 1. Replace Hindi danda (।) and double danda (॥) with gentle cadence pauses
      processed = processed.replace(/।/g, '. ').replace(/॥/g, '. ');

      // 2. Transliterated / Borrowed technical terms
      for (const [key, val] of Object.entries(DEVANAGARI_LOANWORD_MAP)) {
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        processed = processed.replace(regex, val);
      }

      // 3. Format standalone percentages
      processed = processed.replace(/(\d+)\s*%/g, '$1 प्रतिशत');

      return {
        originalText: text,
        processedText: processed.trim(),
        detectedLanguage: 'hi',
        recommendedLocale: 'hi-IN',
        recommendedPitch: 0.95, // Crisp, natural pitch for Hindi voices (prevents muffled mumbling)
        recommendedRate: 0.94,  // Measured, articulate cadence for conjunct consonants
        isHindi: true,
        isHinglish: false,
        isEnglish: false,
      };
    }

    if (detected === 'en-IN') {
      // --- HINGLISH (Mixed Hindi & English in Latin script) ---
      // 1. Expand technical acronyms
      for (const [key, val] of Object.entries(ACRONYM_MAP)) {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        processed = processed.replace(regex, val);
      }

      // 2. Phonetic stress enhancements for Hindi words in Latin
      for (const [regex, replacement] of HINGLISH_PHONETIC_REPLACEMENTS) {
        processed = processed.replace(regex, replacement);
      }

      // 3. Ensure sentence boundary pauses
      processed = processed.replace(/([.!?])\s*/g, '$1 ');

      return {
        originalText: text,
        processedText: processed.trim(),
        detectedLanguage: 'en-IN',
        recommendedLocale: 'en-IN',
        recommendedPitch: 0.90, // Balanced, authoritative pitch with authentic Indian English inflection
        recommendedRate: 0.93,
        isHindi: false,
        isHinglish: true,
        isEnglish: false,
      };
    }

    // --- STANDARD ENGLISH ---
    // 1. Expand technical acronyms
    for (const [key, val] of Object.entries(ACRONYM_MAP)) {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      processed = processed.replace(regex, val);
    }

    // 2. Number / percentage clarity
    processed = processed.replace(/(\d+)\s*%/g, '$1 percent');

    return {
      originalText: text,
      processedText: processed.trim(),
      detectedLanguage: 'en',
      recommendedLocale: 'en-US',
      recommendedPitch: 0.72, // Ultron deep resonant baritone
      recommendedRate: 0.92,
      isHindi: false,
      isHinglish: false,
      isEnglish: true,
    };
  }
}
