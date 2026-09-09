/**
 * Language Detector for Voice & TTS Pipeline
 *
 * Detects Hindi, Hinglish, and English text to optimize TTS synthesis,
 * pronunciation preservation, and ElevenLabs language_code configuration.
 *
 * Preservation Rules:
 * 1. Hindi responses: Prefer natural Devanagari text (e.g. "मुझे आज कॉलेज जाना है।"),
 *    never blindly convert to Romanized Latin.
 * 2. Hinglish responses: Mixed Hindi + English (e.g. "आज मेरा project complete हो गया।"),
 *    preserve mixed tokens without translating unnecessarily.
 * 3. English responses: Pure English text routed cleanly.
 * 4. Punctuation & Pause Preservation: Retains Devanagari danda (।), commas, periods,
 *    question marks, and natural sentence pauses.
 */

export type DetectedLanguage = 'hi' | 'en' | 'hinglish';

export interface LanguageDetectionResult {
  language: DetectedLanguage;
  languageCode: 'hi' | 'en';
  hasDevanagari: boolean;
  hasLatin: boolean;
  isPureHindi: boolean;
  isHinglish: boolean;
  isEnglish: boolean;
  devanagariCharCount: number;
  latinCharCount: number;
  confidence: number;
}

const DEVANAGARI_REGEX = /[\u0900-\u097F]/g;
const LATIN_REGEX = /[a-zA-Z]/g;

// Common Romanized Hindi/Hinglish vocabulary tokens for Latin-script text detection
const HINGLISH_LATIN_KEYWORDS = new Set([
  'aap', 'aapka', 'aapko', 'aaj', 'achha', 'accha', 'aur', 'batao', 'bataiye',
  'bhi', 'bohot', 'chahiye', 'chalu', 'chal', 'dhanyawad', 'ek', 'gaya', 'gayi',
  'haan', 'hai', 'hain', 'ho', 'hoga', 'hogi', 'hum', 'jaana', 'jana', 'karna',
  'karein', 'karo', 'kaise', 'kya', 'kyun', 'kab', 'kripya', 'lagta', 'lekin',
  'mera', 'meri', 'mere', 'mujhe', 'mujhko', 'nahi', 'nahin', 'namaste', 'pe',
  'par', 'roko', 'samay', 'shukriya', 'suno', 'theek', 'thoda', 'tum', 'tumhara',
  'wala', 'wali', 'wale', 'ye', 'yeh', 'woh', 'wo'
]);

export class LanguageDetector {
  /**
   * Detect language and character distribution of input text.
   */
  public static detect(text: string): LanguageDetectionResult {
    if (!text || typeof text !== 'string') {
      return {
        language: 'en',
        languageCode: 'en',
        hasDevanagari: false,
        hasLatin: false,
        isPureHindi: false,
        isHinglish: false,
        isEnglish: true,
        devanagariCharCount: 0,
        latinCharCount: 0,
        confidence: 1.0,
      };
    }

    const devanagariMatches = text.match(DEVANAGARI_REGEX);
    const latinMatches = text.match(LATIN_REGEX);

    const devanagariCount = devanagariMatches ? devanagariMatches.length : 0;
    const latinCount = latinMatches ? latinMatches.length : 0;

    const hasDevanagari = devanagariCount > 0;
    const hasLatin = latinCount > 0;

    // Case 1: Has Devanagari script
    if (hasDevanagari) {
      if (hasLatin) {
        // Mixed Devanagari + Latin (e.g. "आज मेरा project complete हो गया।")
        return {
          language: 'hinglish',
          languageCode: 'hi', // ElevenLabs handles multilingual with 'hi' code
          hasDevanagari: true,
          hasLatin: true,
          isPureHindi: false,
          isHinglish: true,
          isEnglish: false,
          devanagariCharCount: devanagariCount,
          latinCharCount: latinCount,
          confidence: 0.95,
        };
      }

      // Pure Devanagari Hindi
      return {
        language: 'hi',
        languageCode: 'hi',
        hasDevanagari: true,
        hasLatin: false,
        isPureHindi: true,
        isHinglish: false,
        isEnglish: false,
        devanagariCharCount: devanagariCount,
        latinCharCount: 0,
        confidence: 0.99,
      };
    }

    // Case 2: Only Latin script - check for Romanized Hinglish vs English
    if (hasLatin) {
      const words = text.toLowerCase().split(/[\s,.;:!?।\-()"]+/).filter(Boolean);
      let hinglishKeywordCount = 0;

      for (const word of words) {
        if (HINGLISH_LATIN_KEYWORDS.has(word)) {
          hinglishKeywordCount++;
        }
      }

      const hinglishRatio = words.length > 0 ? hinglishKeywordCount / words.length : 0;

      if (hinglishKeywordCount >= 2 || hinglishRatio >= 0.25) {
        return {
          language: 'hinglish',
          languageCode: 'hi', // For Hinglish in ElevenLabs, 'hi' triggers multilingual voice tuning
          hasDevanagari: false,
          hasLatin: true,
          isPureHindi: false,
          isHinglish: true,
          isEnglish: false,
          devanagariCharCount: 0,
          latinCharCount: latinCount,
          confidence: Math.min(0.9, 0.5 + hinglishRatio),
        };
      }

      // Standard English
      return {
        language: 'en',
        languageCode: 'en',
        hasDevanagari: false,
        hasLatin: true,
        isPureHindi: false,
        isHinglish: false,
        isEnglish: true,
        devanagariCharCount: 0,
        latinCharCount: latinCount,
        confidence: 0.98,
      };
    }

    // Default fallback
    return {
      language: 'en',
      languageCode: 'en',
      hasDevanagari: false,
      hasLatin: false,
      isPureHindi: false,
      isHinglish: false,
      isEnglish: true,
      devanagariCharCount: 0,
      latinCharCount: 0,
      confidence: 0.5,
    };
  }

  /**
   * Safe sentence/chunk segmentation for streaming or TTS synthesis.
   * Splits at natural sentence boundaries (।, ., !, ?, \n) without breaking words
   * or sacrificing pronunciation quality.
   */
  public static segmentIntoSentences(text: string): string[] {
    if (!text || !text.trim()) return [];

    // Split on Hindi danda (।), periods, question marks, exclamation points, newlines
    // Retaining sentence delimiter with punctuation preserved
    const rawSegments = text.match(/[^।!?.?\n]+[।!?.?\n]*/g) || [text];

    const segments: string[] = [];
    let currentBuffer = '';

    for (const segment of rawSegments) {
      const trimmed = segment.trim();
      if (!trimmed) continue;

      // Avoid creating tiny incomplete fragments (< 4 chars unless it's a short response)
      if (trimmed.length < 5 && currentBuffer.length > 0) {
        currentBuffer += ' ' + trimmed;
      } else {
        if (currentBuffer) {
          segments.push(currentBuffer.trim());
        }
        currentBuffer = trimmed;
      }
    }

    if (currentBuffer.trim()) {
      segments.push(currentBuffer.trim());
    }

    return segments.length > 0 ? segments : [text.trim()];
  }
}
