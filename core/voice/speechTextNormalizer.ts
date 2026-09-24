/**
 * Speech Text Normalization Layer (Phase 3 Voice Engine Fix)
 *
 * Implements the mandatory preprocessing pipeline:
 * AI Response
 * → SpeechTextNormalizer
 * → Language Detection
 * → TTS (ElevenLabs multilingual_v2 / Local System)
 * → Audio Output
 *
 * Guarantees:
 * 1. Preserves normal words as complete words (never spells letter-by-letter like "J A R V I S, M E R A...").
 * 2. Keeps technical terms readable and untranslated (YouTube, Gemini, Google, Windows, CPU, GPU, RAM, API, URL, HTML, CSS, JavaScript).
 * 3. Does NOT pronounce every capitalized word as individual letters; normalizes case of words in ALL CAPS.
 * 4. Abbreviations (CPU, API, RAM) use natural pronunciation, not "C P U" or "A P I", unless spelling was explicitly requested.
 * 5. Supports Hindi written in Devanagari ("क्या हाल है?") and Hinglish in Roman script ("Kya haal hai?").
 * 6. Strips markdown: **, *, `, #, bullets, tables, blockquotes, horizontal rules.
 * 7. Never sends raw JSON or raw tool output to TTS — replaces with conversational summaries.
 * 8. Replaces raw URLs with natural speech ("Link ready hai." / "The link is ready.").
 * 9. Summarizes code blocks instead of speaking code character-by-character.
 * 10. Provides TTS debug preview payload (Original vs Normalized speech text).
 */

export interface SpeechNormalizationOptions {
  userPrompt?: string;
  userPromptLanguage?: 'hi' | 'hinglish' | 'en' | 'auto';
  isExplicitSpellingRequested?: boolean;
  targetLanguageMode?: 'AUTO' | 'HINDI' | 'HINGLISH' | 'ENGLISH';
}

export interface SpeechNormalizationResult {
  originalText: string;
  normalizedText: string;
  detectedLanguage: 'hi' | 'hinglish' | 'en';
  languageCode: 'hi' | 'en';
  hasUrl: boolean;
  hasCodeBlock: boolean;
  hasMarkdown: boolean;
  hasJsonOrToolOutput: boolean;
  technicalTermsPreserved: string[];
  summariesApplied: string[];
}

// Technical terms that must be preserved and read naturally
const TECHNICAL_TERMS = [
  'YouTube',
  'Gemini',
  'Google',
  'Windows',
  'CPU',
  'GPU',
  'RAM',
  'API',
  'URL',
  'HTML',
  'CSS',
  'JavaScript',
  'JS',
  'Three.js',
  'React',
  'Node.js',
  'Linux',
  'macOS',
  'Android',
  'iOS',
  'WiFi',
  'Bluetooth',
  'TTS',
  'STT',
  'HUD',
];

// Technical term case mapping for case-insensitive lookup
const TECHNICAL_TERMS_MAP: Record<string, string> = {
  youtube: 'YouTube',
  gemini: 'Gemini',
  google: 'Google',
  windows: 'Windows',
  cpu: 'CPU',
  gpu: 'GPU',
  ram: 'RAM',
  api: 'API',
  url: 'URL',
  html: 'HTML',
  css: 'CSS',
  javascript: 'JavaScript',
  js: 'JS',
  'three.js': 'Three.js',
  react: 'React',
  'node.js': 'Node.js',
  linux: 'Linux',
  macos: 'macOS',
  android: 'Android',
  ios: 'iOS',
  wifi: 'WiFi',
  bluetooth: 'Bluetooth',
  tts: 'TTS',
  stt: 'STT',
  hud: 'HUD',
};

// Common abbreviations that shouldn't be spelled letter-by-letter with pauses
const NATURAL_ABBREVIATIONS = new Set([
  'CPU', 'GPU', 'RAM', 'API', 'URL', 'HTML', 'CSS', 'AI', 'UI', 'UX', 'OS',
  'ID', 'IP', 'TTS', 'STT', 'HUD', 'GLB', 'PBR', 'RGB', 'SQL', 'CLI', 'SSH',
  'HTTP', 'HTTPS', 'REST', 'SMS',
]);

// Devanagari range check
const DEVANAGARI_REGEX = /[\u0900-\u097F]/;

// Keywords indicating Hinglish in Roman script
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
  'dilaunga', 'dilaungi', 'dilana', 'badhiya', 'theek',
  'karti', 'karta', 'dungi', 'dunga', 'leti', 'leta', 'rahi', 'raha',
  'sakti', 'sakta', 'samajh', 'kar', 'hoon', 'hu', 'hun', 'main', 'mai', 'karega', 'karegi'
]);

export class SpeechTextNormalizer {
  /**
   * Main entry point: normalizes AI responses, tool outputs, and commands before TTS
   */
  public static normalize(
    rawText: string,
    options: SpeechNormalizationOptions = {}
  ): SpeechNormalizationResult {
    if (!rawText || !rawText.trim()) {
      return {
        originalText: rawText || '',
        normalizedText: '',
        detectedLanguage: 'en',
        languageCode: 'en',
        hasUrl: false,
        hasCodeBlock: false,
        hasMarkdown: false,
        hasJsonOrToolOutput: false,
        technicalTermsPreserved: [],
        summariesApplied: [],
      };
    }

    const summariesApplied: string[] = [];
    const technicalTermsPreserved: string[] = [];
    let text = rawText.trim();

    // 0. Detect whether spelling was explicitly requested
    const isSpellingRequested =
      options.isExplicitSpellingRequested ??
      Boolean(
        options.userPrompt &&
          /\b(spell|spelling|letter by letter|har ek akshar|akshar akshar)\b/i.test(options.userPrompt)
      );

    // 1. Initial Language Classification
    const initialLang = this.detectLanguage(text, options);

    // 2. Check and handle raw JSON or Tool Output
    const isJsonOrTool = this.isRawJsonOrToolOutput(text);
    let hasJsonOrToolOutput = isJsonOrTool;

    if (isJsonOrTool) {
      hasJsonOrToolOutput = true;
      summariesApplied.push('json_tool_output_summarized');
      text = this.summarizeJsonOrTool(text, initialLang);
    }

    // 3. Check and summarize Code Blocks
    const hasCodeBlock = /```[\s\S]*?```/.test(text);
    if (hasCodeBlock) {
      summariesApplied.push('code_block_summarized');
      text = this.summarizeCodeBlocks(text, initialLang);
    }

    // 4. Check and sanitize URLs
    const hasUrl = /https?:\/\/[^\s]+|www\.[^\s]+/i.test(text) || /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/i.test(text);
    if (hasUrl) {
      summariesApplied.push('urls_sanitized_to_natural_phrase');
      text = this.sanitizeUrls(text, initialLang);
    }

    // 5. Remove and clean Markdown formatting
    const hasMarkdown = /[*_`#~>|\-\+]/.test(text);
    if (hasMarkdown) {
      text = this.cleanMarkdown(text);
    }

    // 6. Fix spaced-out letters (e.g., "J A R V I S" -> "Jarvis", "M E R A" -> "Mera")
    text = this.collapseSpacedLetters(text);

    // 7. Case Normalization (PREVENTS letter-by-letter spelling of regular capitalized words)
    text = this.normalizeCapitalization(text, isSpellingRequested);

    // 8. Abbreviations & Technical Term Handling (CPU, API, RAM, etc.)
    text = this.normalizeTechnicalTermsAndAbbreviations(text, isSpellingRequested, technicalTermsPreserved);

    // 9. Female Voice Persona Grammar Alignment (Consistent feminine Hindi/Hinglish for assistant)
    const preliminaryLang = this.detectLanguage(text, options);
    text = this.alignFemaleVoicePersonaGrammar(text, preliminaryLang);

    // 10. Hindi & Hinglish Conversational Articulation Adjustments
    const finalLang = this.detectLanguage(text, options);
    text = this.optimizeLanguageCadence(text, finalLang);

    // 11. Clean up extra spaces, duplicate punctuation
    text = this.cleanWhitespaceAndPunctuation(text);

    return {
      originalText: rawText,
      normalizedText: text,
      detectedLanguage: finalLang,
      languageCode: finalLang === 'en' ? 'en' : 'hi',
      hasUrl,
      hasCodeBlock,
      hasMarkdown,
      hasJsonOrToolOutput,
      technicalTermsPreserved,
      summariesApplied,
    };
  }

  /**
   * Detects whether text is Hindi (Devanagari), Hinglish (Roman script), or English
   */
  public static detectLanguage(
    text: string,
    options: SpeechNormalizationOptions = {}
  ): 'hi' | 'hinglish' | 'en' {
    if (options.targetLanguageMode === 'HINDI') return 'hi';
    if (options.targetLanguageMode === 'HINGLISH') return 'hinglish';
    if (options.targetLanguageMode === 'ENGLISH') return 'en';

    if (!text) return 'en';

    // 1. Devanagari script detected -> Hindi
    if (DEVANAGARI_REGEX.test(text)) {
      return 'hi';
    }

    // 2. Romanized Hinglish vocabulary detection
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    let hinglishCount = 0;
    for (const w of words) {
      if (HINGLISH_KEYWORDS.has(w)) {
        hinglishCount++;
      }
    }

    const ratio = words.length > 0 ? hinglishCount / words.length : 0;
    if (hinglishCount >= 2 || ratio >= 0.20) {
      return 'hinglish';
    }

    // 3. Inherit from user prompt language if ambiguous and short
    if (options.userPromptLanguage === 'hi') return 'hi';
    if (options.userPromptLanguage === 'hinglish') return 'hinglish';

    if (options.userPrompt) {
      if (DEVANAGARI_REGEX.test(options.userPrompt)) return 'hi';
      const promptWords = options.userPrompt.toLowerCase().split(/\s+/);
      const promptHinglishCount = promptWords.filter((w) => HINGLISH_KEYWORDS.has(w)).length;
      if (promptHinglishCount >= 1) return 'hinglish';
    }

    return 'en';
  }

  /**
   * Detects if text is a raw JSON payload, tool result, or API response
   */
  public static isRawJsonOrToolOutput(text: string): boolean {
    const trimmed = text.trim();
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        JSON.parse(trimmed);
        return true;
      } catch {
        // Look for strong JSON key patterns
        if (/"(?:status|result|success|error|code|data|message)"\s*:/i.test(trimmed)) {
          return true;
        }
      }
    }
    // Markdown json code block alone
    if (/^```json\s*\{[\s\S]*\}\s*```$/i.test(trimmed)) {
      return true;
    }
    return false;
  }

  /**
   * Summarizes raw JSON or tool outputs into human speech
   */
  private static summarizeJsonOrTool(text: string, lang: 'hi' | 'hinglish' | 'en'): string {
    let parsed: any = null;
    try {
      const cleanJsonStr = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      parsed = JSON.parse(cleanJsonStr);
    } catch {
      parsed = null;
    }

    if (parsed) {
      // Check for common status fields
      const status = parsed.status || (parsed.success ? 'success' : undefined) || parsed.state;
      const message = parsed.message || parsed.summary || parsed.description;

      if (message && typeof message === 'string' && !message.includes('{')) {
        return message;
      }

      if (status === 'success' || parsed.success === true) {
        if (lang === 'hi') return 'कार्य सफलतापूर्वक पूरा हो गया है।';
        if (lang === 'hinglish') return 'Action complete ho gaya hai.';
        return 'Action completed successfully.';
      }

      if (status === 'error' || parsed.error) {
        if (lang === 'hi') return 'एक त्रुटि हुई है। कृपया पुनः प्रयास करें।';
        if (lang === 'hinglish') return 'Kuch gadbad hui hai. Kripya dobara try karein.';
        return 'An error occurred during execution.';
      }
    }

    // Default friendly summary
    if (lang === 'hi') return 'डेटा सफलतापूर्वक प्रोसेस हो गया है।';
    if (lang === 'hinglish') return 'Data successfully process ho gaya hai.';
    return 'The requested operation has finished processing.';
  }

  /**
   * Summarizes code blocks instead of reading code character-by-character
   */
  private static summarizeCodeBlocks(text: string, lang: 'hi' | 'hinglish' | 'en'): string {
    return text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, _langName) => {
      if (lang === 'hi') return ' कोड स्निपेट तैयार है। ';
      if (lang === 'hinglish') return ' Code snippet ready hai. ';
      return ' The code snippet is ready. ';
    });
  }

  /**
   * Replaces raw URLs and markdown links with natural phrasing like "Link ready hai."
   */
  private static sanitizeUrls(text: string, lang: 'hi' | 'hinglish' | 'en'): string {
    let result = text;

    // 1. Markdown links: [YouTube Video](https://...) -> "YouTube Video"
    result = result.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi, (_m, title) => {
      return title.trim();
    });

    // 2. Raw URLs: https://... or http://... or www....
    const naturalLinkReplacement =
      lang === 'hi'
        ? ' लिंक तैयार है।'
        : lang === 'hinglish'
        ? ' Link ready hai.'
        : ' The link is ready.';

    // Replace URLs with natural phrase
    result = result.replace(/(https?:\/\/[^\s]+|www\.[^\s]+)/gi, () => {
      return naturalLinkReplacement;
    });

    return result;
  }

  /**
   * Removes markdown formatting (**bold**, *italic*, headers, blockquotes, bullets, tables)
   */
  private static cleanMarkdown(text: string): string {
    let clean = text;

    // Remove inline backticks `command` -> command
    clean = clean.replace(/`([^`]+)`/g, '$1');

    // Remove bold and italics: **text**, *text*, __text__, _text_
    clean = clean.replace(/(\*\*|__)(.*?)\1/g, '$2');
    clean = clean.replace(/(\*|_)(.*?)\1/g, '$2');

    // Remove strikethrough ~~text~~
    clean = clean.replace(/~~(.*?)~~/g, '$1');

    // Remove markdown headers (# Title, ## Subtitle)
    clean = clean.replace(/^#{1,6}\s+(.*)$/gm, '$1. ');

    // Remove blockquotes (> quote)
    clean = clean.replace(/^>\s+(.*)$/gm, '$1');

    // Convert bullet lists and numbered lists into flowing speech with natural cadence
    clean = clean.replace(/^\s*[-*+]\s+(.*)$/gm, '$1, ');
    clean = clean.replace(/^\s*\d+\.\s+(.*)$/gm, '$1. ');

    // Remove horizontal rules
    clean = clean.replace(/^[-*_]{3,}$/gm, '');

    // Remove markdown tables (pipe characters)
    clean = clean.replace(/\|/g, ' ');

    return clean;
  }

  /**
   * Collapses letter-by-letter spaced text like "J A R V I S" -> "Jarvis" or "M E R A" -> "Mera"
   */
  private static collapseSpacedLetters(text: string): string {
    // Matches 3 or more spaced single Latin letters: "J A R V I S" or "M E R A"
    return text.replace(/\b([A-Za-z])(?:\s+([A-Za-z])){2,}\b/g, (match) => {
      const joined = match.replace(/\s+/g, '');
      const lower = joined.toLowerCase();
      // If it's a known assistant name or word
      if (lower === 'jarvis') return 'Jarvis';
      if (lower === 'ultron') return 'Ultron';
      if (lower === 'mera') return 'Mera';
      if (lower === 'status') return 'Status';
      if (lower === 'system') return 'System';
      // Otherwise keep in title case so it doesn't get spelled
      return joined.charAt(0).toUpperCase() + joined.slice(1).toLowerCase();
    });
  }

  /**
   * Normalizes capitalization so regular words written in ALL CAPS are NEVER spelled letter-by-letter
   */
  private static normalizeCapitalization(text: string, isSpellingRequested: boolean): string {
    // If user explicitly asked for spelling, keep uppercase abbreviations intact
    if (isSpellingRequested) return text;

    // Check if the entire string is in ALL CAPS: "JARVIS, MERA SYSTEM STATUS BATAO"
    const hasDevanagari = DEVANAGARI_REGEX.test(text);
    if (!hasDevanagari) {
      const letters = text.replace(/[^a-zA-Z]/g, '');
      const upperLetters = text.replace(/[^A-Z]/g, '');
      if (letters.length > 6 && upperLetters.length / letters.length > 0.85) {
        // Convert whole sentence to sentence case
        text = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
      }
    }

    // Inspect individual words
    return text.replace(/\b[A-Z]{2,}\b/g, (word) => {
      const upper = word.toUpperCase();

      // If it's a known technical abbreviation that should stay as-is:
      if (NATURAL_ABBREVIATIONS.has(upper)) {
        return upper;
      }

      // If it's JARVIS or ULTRON
      if (upper === 'JARVIS') return 'Jarvis';
      if (upper === 'ULTRON') return 'Ultron';

      // For common Hinglish & English words in ALL CAPS (MERA, SYSTEM, STATUS, BILKUL, AAPKA, etc.):
      // Convert to lowercase or Titlecase so TTS does not spell them!
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
  }

  /**
   * Normalizes abbreviations and technical terms for natural articulation:
   * CPU, API, RAM, YouTube, Gemini, Windows, Google, etc.
   */
  private static normalizeTechnicalTermsAndAbbreviations(
    text: string,
    isSpellingRequested: boolean,
    preservedTermsOut: string[]
  ): string {
    let result = text;

    // 1. Preserve canonical casing for technical terms
    for (const [key, canonical] of Object.entries(TECHNICAL_TERMS_MAP)) {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      if (regex.test(result)) {
        preservedTermsOut.push(canonical);
        result = result.replace(regex, canonical);
      }
    }

    // 2. Handle abbreviations:
    // If spelling is NOT requested:
    // - "RAM" is pronounced naturally as "Ram" (avoids R - A - M)
    // - "API" remains "API" without dots (removes legacy "A.P.I.")
    // - "CPU" remains "CPU" without dots (removes legacy "C.P.U.")
    // - "URL" remains "URL" or "Link"
    if (!isSpellingRequested) {
      // Remove any previously inserted dots in acronyms that force letter-by-letter reading
      result = result.replace(/\bA\.P\.I\.\b/gi, 'API');
      result = result.replace(/\bC\.P\.U\.\b/gi, 'CPU');
      result = result.replace(/\bG\.P\.U\.\b/gi, 'GPU');
      result = result.replace(/\bU\.R\.L\.\b/gi, 'URL');
      result = result.replace(/\bH\.T\.M\.L\.\b/gi, 'HTML');
      result = result.replace(/\bC\.S\.S\.\b/gi, 'CSS');
      result = result.replace(/\bU\.I\.\b/gi, 'UI');
      result = result.replace(/\bU\.X\.\b/gi, 'UX');
      result = result.replace(/\bA\.I\.\b/gi, 'AI');

      // In Hinglish/Hindi, RAM is spoken as "ram" or "memory"
      result = result.replace(/\bRAM\b/g, 'Ram');
    } else {
      // User explicitly asked for spelling: expand to separated letters
      result = result.replace(/\bCPU\b/g, 'C, P, U');
      result = result.replace(/\bAPI\b/g, 'A, P, I');
      result = result.replace(/\bGPU\b/g, 'G, P, U');
    }

    return result;
  }

  /**
   * Optimizes Hindi and Hinglish sentence cadence and pauses:
   * - Replaces Hindi danda (।) with period for natural sentence cadence pause.
   * - Ensures smooth conjunct articulation.
   */
  private static optimizeLanguageCadence(text: string, lang: 'hi' | 'hinglish' | 'en'): string {
    let result = text;

    if (lang === 'hi') {
      // Replace Hindi danda (।) and double danda (॥) with standard cadence pause
      result = result.replace(/।/g, '. ').replace(/॥/g, '. ');

      // Percentage symbol to Hindi
      result = result.replace(/(\d+)\s*%/g, '$1 प्रतिशत');
    } else if (lang === 'hinglish') {
      // Ensure Hinglish sentences end with clean pauses
      result = result.replace(/([.!?])\s*/g, '$1 ');

      // Percentage symbol
      result = result.replace(/(\d+)\s*%/g, '$1 percent');
    } else {
      // English percentages
      result = result.replace(/(\d+)\s*%/g, '$1 percent');
    }

    return result;
  }

  /**
   * Enforces feminine grammatical forms for the female assistant voice persona in Hindi & Hinglish.
   *
   * Rules:
   * 1. In Hindi and Hinglish, the assistant consistently uses feminine forms for herself:
   *    - "Main check karti hoon" (not "karta hoon")
   *    - "Main bata deti hoon" / "Main bataungi" (not "bata dunga")
   *    - "Main kar dungi" / "Main kar rahi hoon" (not "kar dunga" / "kar raha hoon")
   *    - "Main dekh leti hoon" / "Main dekh lungi" (not "dekh leta hoon" / "dekh lunga")
   *    - "Main samajh gayi" (not "samajh gaya")
   *    - "Main ready hoon" / "Maine check kar liya hai"
   *    - "Main aapki kya madad kar sakti hoon?" (not "kar sakta hoon")
   * 2. Preserves the user's gender and expressions intact (only modifies assistant self-reference).
   * 3. For English, keeps natural English.
   */
  public static alignFemaleVoicePersonaGrammar(text: string, _lang?: 'hi' | 'hinglish' | 'en'): string {
    if (!text) return text;

    let result = text;

    // 1. Romanized Hinglish Female Persona Normalization
    // A. "Main ... karta hoon / hu / hun" -> "Main ... karti hoon / hu"
    result = result.replace(
      /\b(main|mai)\s+([a-zA-Z\s]{0,35}?\b)?karta\s+(hoon|hu|hun)\b/gi,
      (_m, p1, p2, p3) => `${p1} ${p2 || ''}karti ${p3}`
    );

    // B. "Main ... kar raha hoon" -> "Main ... kar rahi hoon"
    result = result.replace(
      /\b(main|mai)\s+([a-zA-Z\s]{0,35}?\b)?kar\s+raha\s+(hoon|hu|hun)\b/gi,
      (_m, p1, p2, p3) => `${p1} ${p2 || ''}kar rahi ${p3}`
    );

    // C. "Main ... kar dunga / karunga" -> "Main ... kar dungi / karungi"
    result = result.replace(
      /\b(main|mai)\s+([a-zA-Z\s]{0,35}?\b)?kar\s+dunga\b/gi,
      (_m, p1, p2) => `${p1} ${p2 || ''}kar dungi`
    );
    result = result.replace(
      /\b(main|mai)\s+([a-zA-Z\s]{0,35}?\b)?karunga\b/gi,
      (_m, p1, p2) => `${p1} ${p2 || ''}karungi`
    );

    // D. "Main ... bata dunga / bataunga / bata deta hoon" -> "Main ... bata dungi / bataungi / bata deti hoon"
    result = result.replace(
      /\b(main|mai)\s+([a-zA-Z\s]{0,35}?\b)?bata\s+dunga\b/gi,
      (_m, p1, p2) => `${p1} ${p2 || ''}bata dungi`
    );
    result = result.replace(
      /\b(main|mai)\s+([a-zA-Z\s]{0,35}?\b)?bataunga\b/gi,
      (_m, p1, p2) => `${p1} ${p2 || ''}bataungi`
    );
    result = result.replace(
      /\b(main|mai)\s+([a-zA-Z\s]{0,35}?\b)?bata\s+deta\s+(hoon|hu|hun)\b/gi,
      (_m, p1, p2, p3) => `${p1} ${p2 || ''}bata deti ${p3}`
    );

    // E. "Main ... dekh leta hoon / dekh lunga" -> "Main ... dekh leti hoon / dekh lungi"
    result = result.replace(
      /\b(main|mai)\s+([a-zA-Z\s]{0,35}?\b)?dekh\s+leta\s+(hoon|hu|hun)\b/gi,
      (_m, p1, p2, p3) => `${p1} ${p2 || ''}dekh leti ${p3}`
    );
    result = result.replace(
      /\b(main|mai)\s+([a-zA-Z\s]{0,35}?\b)?dekh\s+lunga\b/gi,
      (_m, p1, p2) => `${p1} ${p2 || ''}dekh lungi`
    );

    // F. "Main ... samajh gaya" -> "Main ... samajh gayi"
    result = result.replace(
      /\b(main|mai)\s+([a-zA-Z\s]{0,25}?\b)?samajh\s+gaya\b/gi,
      (_m, p1, p2) => `${p1} ${p2 || ''}samajh gayi`
    );

    // G. "Main ... kar sakta hoon" / "madad kar sakta hoon" -> "... kar sakti hoon"
    result = result.replace(
      /\b(main|mai)\s+([a-zA-Z\s]{0,35}?\b)?kar\s+sakta\s+(hoon|hu|hun)\b/gi,
      (_m, p1, p2, p3) => `${p1} ${p2 || ''}kar sakti ${p3}`
    );
    result = result.replace(
      /\bmadad\s+kar\s+sakta\s+(hoon|hu|hun)\b/gi,
      (_m, p1) => `madad kar sakti ${p1}`
    );

    // H. "Main ... chal raha hoon / operate kar raha hoon / soch raha hoon"
    result = result.replace(
      /\b(main|mai)\s+([a-zA-Z\s]{0,35}?\b)?chal\s+raha\s+(hoon|hu|hun)\b/gi,
      (_m, p1, p2, p3) => `${p1} ${p2 || ''}chal rahi ${p3}`
    );
    result = result.replace(
      /\b(main|mai)\s+([a-zA-Z\s]{0,35}?\b)?operate\s+kar\s+raha\s+(hoon|hu|hun)\b/gi,
      (_m, p1, p2, p3) => `${p1} ${p2 || ''}operate kar rahi ${p3}`
    );
    result = result.replace(
      /\b(main|mai)\s+([a-zA-Z\s]{0,35}?\b)?soch\s+raha\s+(hoon|hu|hun)\b/gi,
      (_m, p1, p2, p3) => `${p1} ${p2 || ''}soch rahi ${p3}`
    );

    // I. Reminders & Confirmations: "yaad dilaunga" -> "yaad dilaungi"
    result = result.replace(
      /\byaad\s+dilaunga\b/gi,
      'yaad dilaungi'
    );

    // J. Assistant self-identification: "Main aapka ... assistant hoon" -> "Main aapki ... assistant hoon"
    result = result.replace(
      /\b(main|mai)\s+aapka\s+([a-zA-Z\s]{0,20}?\b)?(assistant|sathi|madadgar)\b/gi,
      (_m, p1, p2, p3) => `${p1} aapki ${p2 || ''}${p3}`
    );

    // K. Direct first-person actions without explicit "Main":
    // e.g., "YouTube open kar raha hoon" -> "YouTube open kar rahi hoon"
    // "Sure, ... search kar raha hoon" -> "Sure, ... search kar rahi hoon"
    // "status check karta hoon" -> "status check karti hoon"
    result = result.replace(
      /\b([a-zA-Z\s]{0,25}?\b)?(open|play|search|check|inspect|verify|process|load|handle|execute|solve)\s+kar\s+raha\s+(hoon|hu|hun)\b/gi,
      (_m, p1, p2, p3) => `${p1 || ''}${p2} kar rahi ${p3}`
    );
    result = result.replace(
      /\b([a-zA-Z]+)\s+kar\s+raha\s+(hoon|hu|hun)\b/gi,
      (_m, p1, p2) => `${p1} kar rahi ${p2}`
    );
    result = result.replace(
      /\b([a-zA-Z]+)\s+karta\s+(hoon|hu|hun)\b/gi,
      (_m, p1, p2) => `${p1} karti ${p2}`
    );
    result = result.replace(
      /\bkarta\s+(hoon|hu|hun)\b/gi,
      (_m, p1) => `karti ${p1}`
    );
    result = result.replace(
      /\b(bata|kar|dekh|bana|sun|rakh|samjha|bhej|chala|padh|likh)\s+dunga\b/gi,
      (_m, p1) => `${p1} dungi`
    );
    result = result.replace(
      /\b(karunga|bataunga|dekhunga|banaunga|sununga|bolunga|chalaunga|rahunga)\b/gi,
      (match) => {
        const lower = match.toLowerCase();
        const map: Record<string, string> = {
          karunga: 'karungi',
          bataunga: 'bataungi',
          dekhunga: 'dekhungi',
          banaunga: 'banaungi',
          sununga: 'sunungi',
          bolunga: 'bolungi',
          chalaunga: 'chalaungi',
          rahunga: 'rahungi',
        };
        const replaced = map[lower] || lower.replace(/unga$/, 'ungi');
        return match[0] === match[0].toUpperCase()
          ? replaced.charAt(0).toUpperCase() + replaced.slice(1)
          : replaced;
      }
    );
    result = result.replace(
      /\b(dekh|bata|sun|samajh|kar)\s+leta\s+(hoon|hu|hun)\b/gi,
      (_m, p1, p2) => `${p1} leti ${p2}`
    );
    result = result.replace(
      /\b(dekh)\s+lunga\b/gi,
      'dekh lungi'
    );
    result = result.replace(
      /\braha\s+(hoon|hu|hun)\b/gi,
      (_m, p1) => `rahi ${p1}`
    );
    result = result.replace(
      /\bsakta\s+(hoon|hu|hun)\b/gi,
      (_m, p1) => `sakti ${p1}`
    );
    result = result.replace(
      /\bsamajh\s+gaya\b/gi,
      'samajh gayi'
    );

    // Adjectives & state normalizations for assistant
    result = result.replace(
      /\bthaka\s+hua\s+(hoon|hu|hun)\b/gi,
      (_m, p1) => `thaki hui ${p1}`
    );
    result = result.replace(
      /\bakela\s+(hoon|hu|hun)\b/gi,
      (_m, p1) => `akeli ${p1}`
    );

    // L. "Maine check kar liya" -> "Maine check kar liya hai"
    result = result.replace(
      /\b(maine\s+check\s+kar\s+liya)(\b(?!\s*hai)|\s*$)/gi,
      '$1 hai'
    );

    // 2. Devanagari Hindi Female Persona Normalization
    result = result.replace(/करता\s+(हूँ|हूं)/g, 'करती $1');
    result = result.replace(/रहा\s+(हूँ|हूं)/g, 'रही $1');
    result = result.replace(/सकता\s+(हूँ|हूं)/g, 'सकती $1');
    result = result.replace(/(कर|बता|देख|बना|भेज|चला|रख)\s+दूँगा/g, '$1 दूँगी');
    result = result.replace(/(कर|बता|देख|बना|भेज|चला|रख)\s+दूंगा/g, '$1 दूंगी');
    result = result.replace(/करूँगा/g, 'करूँगी');
    result = result.replace(/करूंगा/g, 'करूंगी');
    result = result.replace(/बताऊँगा/g, 'बताऊँगी');
    result = result.replace(/बताऊंगा/g, 'बताऊंगी');
    result = result.replace(/देखूँगा/g, 'देखूँगी');
    result = result.replace(/देखूंगा/g, 'देखूंगी');
    result = result.replace(/रहूँगा/g, 'रहूँगी');
    result = result.replace(/रहूंगा/g, 'रहूंगी');
    result = result.replace(/बोलूँगा/g, 'बोलूँगी');
    result = result.replace(/बोलूंगा/g, 'बोलूंगी');
    result = result.replace(/बता\s+देता\s+(हूँ|हूं)/g, 'बता देती $1');
    result = result.replace(/देख\s+लेता\s+(हूँ|हूं)/g, 'देख लेती $1');
    result = result.replace(/देख\s+लूँगा/g, 'देख लूँगी');
    result = result.replace(/देख\s+लूंगा/g, 'देख लूंगी');
    result = result.replace(/समझ\s+गया/g, 'समझ गई');
    result = result.replace(/चल\s+रहा\s+(हूँ|हूं)/g, 'चल रही $1');
    result = result.replace(/याद\s+दिलाऊँगा/g, 'याद दिलाऊँगी');
    result = result.replace(/याद\s+दिलाऊंगा/g, 'याद दिलाऊंगी');
    result = result.replace(/थका\s+हुआ\s+(हूँ|हूं)/g, 'थकी हुई $1');
    result = result.replace(/अकेला\s+(हूँ|हूं)/g, 'अकेली $1');
    result = result.replace(/मैं\s+आपका\s+(.+?\s+)?असिस्टेंट/g, 'मैं आपकी $1असिस्टेंट');
    result = result.replace(/मैं\s+आपका\s+(.+?\s+)?साथी/g, 'मैं आपकी $1साथी');
    result = result.replace(/मैं\s+आपका\s+(.+?\s+)?मददगार/g, 'मैं आपकी $1मददगार');

    return result;
  }

  /**
   * Cleans excessive whitespaces and duplicate punctuation marks
   */
  private static cleanWhitespaceAndPunctuation(text: string): string {
    let clean = text;

    // Clean duplicate punctuation (e.g., "!!!" -> "!", "???" -> "?", "..." -> ".")
    clean = clean.replace(/!{2,}/g, '!');
    clean = clean.replace(/\?{2,}/g, '?');
    clean = clean.replace(/\.{3,}/g, '.');

    // Clean duplicate commas
    clean = clean.replace(/,\s*,+/g, ',');

    // Clean multiple spaces and tabs
    clean = clean.replace(/[ \t]+/g, ' ');

    // Clean multiple newlines
    clean = clean.replace(/\n{2,}/g, '\n');

    return clean.trim();
  }
}
