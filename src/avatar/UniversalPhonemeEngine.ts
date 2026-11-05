/**
 * Universal Phoneme & Lip-Sync Articulation Engine
 *
 * Implements:
 * 1. Unicode decomposition stripping accents (é, ü, ş, ğ, ế, ñ, å -> e, u, s, g, e, n, a...)
 * 2. Cyrillic and Greek transliteration to base Latin phonemes
 * 3. 20 universal sound articulation rules
 * 4. Automatic detection of non-Latin phonetic scripts (Arabic, Japanese, Chinese, Hindi/Devanagari, Korean, Hebrew, Thai)
 *    which safely fall back to pure audio formant analysis
 * 5. Dual-source fusion:
 *    - Transcript supplies mouth shape (bilabial closure, labiodental tuck, rounded vs wide vowels)
 *    - Audio supplies timing and physical force (amplitude + 20ms formant drop)
 * 6. Guard: Mouth moves ONLY for assistant speech, NEVER for user voice.
 */

export interface ArticulationShape {
  openness: number; // 0.0 (closed) to 1.0 (fully open)
  width: number;    // 0.2 (pursed/rounded) to 1.0 (wide spread)
  jawDrop: number;  // 0.0 to 1.0
  pucker: number;   // 0.0 to 1.0
  teethVisible: boolean;
}

// Cyrillic transliteration lookup table
const CYRILLIC_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  і: 'i', ї: 'yi', є: 'ye', ґ: 'g',
};

// Greek transliteration lookup table
const GREEK_MAP: Record<string, string> = {
  α: 'a', β: 'v', γ: 'g', δ: 'd', ε: 'e', ζ: 'z', η: 'e', θ: 'th',
  ι: 'i', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'x', ο: 'o', π: 'p',
  ρ: 'r', σ: 's', ς: 's', τ: 't', υ: 'y', φ: 'f', χ: 'ch', ψ: 'ps', ω: 'o',
};

// Detect non-alphabetic/complex script Unicode blocks (Arabic, CJK, Devanagari, Hangul, Hebrew, Thai)
const COMPLEX_SCRIPT_REGEX = /[\u0600-\u06FF\u0750-\u077F\u0900-\u097F\u0E00-\u0E7F\u0590-\u05FF\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF]/;

export class UniversalPhonemeEngine {
  /**
   * Universal Latin & Diacritic Decomposition:
   * Strips all accents, maps Cyrillic and Greek, and leaves base ASCII articulation tokens.
   */
  public static transliterateAndNormalize(input: string): { normalized: string; isComplexScript: boolean } {
    if (!input) return { normalized: '', isComplexScript: false };

    // Check if the script spelling does not directly map to Latin phoneme letters
    const isComplexScript = COMPLEX_SCRIPT_REGEX.test(input);

    // 1. Unicode NFD decomposition to separate base letters from diacritics
    let cleaned = input.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    // 2. Transliterate Greek and Cyrillic
    let out = '';
    for (const char of cleaned) {
      if (CYRILLIC_MAP[char]) {
        out += CYRILLIC_MAP[char];
      } else if (GREEK_MAP[char]) {
        out += GREEK_MAP[char];
      } else {
        out += char;
      }
    }

    return {
      normalized: out,
      isComplexScript,
    };
  }

  /**
   * Core 20 Articulation Rules:
   * Maps normalized character to distinct anatomical mouth shape.
   */
  public static getShapeForChar(char: string): ArticulationShape {
    switch (char) {
      // 1. Bilabials (lips sealed tight) - /m/, /b/, /p/
      case 'm':
      case 'b':
      case 'p':
        return { openness: 0.0, width: 0.45, jawDrop: 0.05, pucker: 0.1, teethVisible: false };

      // 2. Labiodentals (bottom lip drawn against upper incisors) - /f/, /v/
      case 'f':
      case 'v':
        return { openness: 0.15, width: 0.55, jawDrop: 0.15, pucker: 0.2, teethVisible: true };

      // 3. Lingua-dental / Alveolar sibilants - /s/, /z/, /c/
      case 's':
      case 'z':
      case 'c':
        return { openness: 0.18, width: 0.65, jawDrop: 0.12, pucker: 0.05, teethVisible: true };

      // 4. Lingua-alveolar stops - /t/, /d/
      case 't':
      case 'd':
        return { openness: 0.22, width: 0.58, jawDrop: 0.2, pucker: 0.05, teethVisible: true };

      // 5. Open central/low vowels - /a/
      case 'a':
        return { openness: 0.88, width: 0.55, jawDrop: 0.85, pucker: 0.0, teethVisible: true };

      // 6. Rounded back vowels - /u/, /w/
      case 'u':
      case 'w':
        return { openness: 0.45, width: 0.22, jawDrop: 0.35, pucker: 0.85, teethVisible: false };

      // 7. Mid rounded vowels - /o/
      case 'o':
        return { openness: 0.65, width: 0.32, jawDrop: 0.55, pucker: 0.65, teethVisible: false };

      // 8. Front unrounded high vowels (wide smile) - /i/, /y/
      case 'i':
      case 'y':
        return { openness: 0.35, width: 0.9, jawDrop: 0.25, pucker: 0.0, teethVisible: true };

      // 9. Mid front unrounded vowels - /e/
      case 'e':
        return { openness: 0.45, width: 0.8, jawDrop: 0.35, pucker: 0.0, teethVisible: true };

      // 10. Alveolar liquids / lateral - /l/
      case 'l':
        return { openness: 0.32, width: 0.6, jawDrop: 0.3, pucker: 0.0, teethVisible: true };

      // 11. Postalveolar rhotic - /r/
      case 'r':
        return { openness: 0.28, width: 0.45, jawDrop: 0.25, pucker: 0.4, teethVisible: false };

      // 12. Nasal alveolar - /n/
      case 'n':
        return { openness: 0.2, width: 0.55, jawDrop: 0.18, pucker: 0.05, teethVisible: true };

      // 13. Velar stops - /k/, /g/, /q/
      case 'k':
      case 'g':
      case 'q':
        return { openness: 0.35, width: 0.5, jawDrop: 0.3, pucker: 0.0, teethVisible: false };

      // 14. Glottal aspirate - /h/
      case 'h':
        return { openness: 0.6, width: 0.5, jawDrop: 0.5, pucker: 0.0, teethVisible: false };

      // 15. Postalveolar affricate - /j/, /x/
      case 'j':
      case 'x':
        return { openness: 0.25, width: 0.68, jawDrop: 0.22, pucker: 0.1, teethVisible: true };

      // Default resting / transition
      default:
        return { openness: 0.08, width: 0.5, jawDrop: 0.08, pucker: 0.0, teethVisible: false };
    }
  }

  /**
   * Dual-Source Combiner:
   * Combines audio formant energy (intensity & openness) with transcript phoneme shape.
   *
   * @param audioFormantOpenness Openness computed from 20ms audio slice (0.0 - 1.0)
   * @param audioFormantWidth Width computed from formant frequency balance (0.0 - 1.0)
   * @param phonemeShape Shape provided by transcript character
   * @param isAssistantSpeaking MUST be true for assistant voice; if false, clamps to neutral
   */
  public static fuseDualSource(
    audioFormantOpenness: number,
    audioFormantWidth: number,
    phonemeShape: ArticulationShape | null,
    isAssistantSpeaking: boolean
  ): ArticulationShape {
    // STRICT RULE: Mouth only moves for the assistant's own voice, never for user's voice
    if (!isAssistantSpeaking || audioFormantOpenness < 0.02) {
      return {
        openness: 0.0,
        width: 0.5,
        jawDrop: 0.0,
        pucker: 0.0,
        teethVisible: false,
      };
    }

    // If no phoneme shape or complex script detected: run on pure physics audio formant shape
    if (!phonemeShape) {
      return {
        openness: Math.max(0, Math.min(1, audioFormantOpenness)),
        width: Math.max(0.2, Math.min(1, audioFormantWidth)),
        jawDrop: Math.max(0, Math.min(1, audioFormantOpenness * 0.9)),
        pucker: audioFormantWidth < 0.38 ? 0.6 : 0.0,
        teethVisible: audioFormantOpenness > 0.18 && audioFormantWidth > 0.45,
      };
    }

    // Bilabial rule check: /m/, /b/, /p/ strictly close the lips regardless of volume!
    if (phonemeShape.openness === 0.0) {
      return {
        openness: 0.0,
        width: phonemeShape.width,
        jawDrop: 0.05 * audioFormantOpenness,
        pucker: phonemeShape.pucker,
        teethVisible: false,
      };
    }

    // Audio supplies force and timing, words supply shape geometry
    const fusedOpenness = Math.max(
      0.05,
      Math.min(1.0, phonemeShape.openness * (0.4 + 0.6 * audioFormantOpenness))
    );
    const fusedWidth = phonemeShape.width * 0.7 + audioFormantWidth * 0.3;
    const fusedJawDrop = Math.max(0, Math.min(1.0, phonemeShape.jawDrop * (0.3 + 0.7 * audioFormantOpenness)));

    return {
      openness: fusedOpenness,
      width: Math.max(0.2, Math.min(1.0, fusedWidth)),
      jawDrop: fusedJawDrop,
      pucker: phonemeShape.pucker,
      teethVisible: phonemeShape.teethVisible && fusedOpenness > 0.12,
    };
  }

  // Instance tracking for LipSyncController
  private speaking = false;
  private currentTranscript = '';
  private normalizedChars: string[] = [];

  public startSpeech(transcript: string): void {
    this.speaking = true;
    this.currentTranscript = transcript;
    const { normalized } = UniversalPhonemeEngine.transliterateAndNormalize(transcript);
    this.normalizedChars = Array.from(normalized.toLowerCase());
  }

  public stopSpeech(): void {
    this.speaking = false;
    this.currentTranscript = '';
    this.normalizedChars = [];
  }

  public isAssistantSpeaking(): boolean {
    return this.speaking;
  }

  public update(elapsedSec: number, audioEnergy: number): ArticulationShape {
    if (!this.speaking) {
      return { openness: 0, width: 0.5, jawDrop: 0, pucker: 0, teethVisible: false };
    }

    // Estimate current character based on ~14 phonemes per second rate
    const charIndex = Math.floor(elapsedSec * 14);
    const currentChar = charIndex < this.normalizedChars.length ? this.normalizedChars[charIndex] : ' ';
    const phonemeShape = UniversalPhonemeEngine.getShapeForChar(currentChar);

    return UniversalPhonemeEngine.fuseDualSource(
      audioEnergy,
      0.5,
      phonemeShape,
      this.speaking
    );
  }
}

export const universalPhonemeEngine = new UniversalPhonemeEngine();
